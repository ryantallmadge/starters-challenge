/**
 * Continuously watches ALL active drafts for the given user and auto-picks
 * for every opponent that is on the clock (highest key_stat in the tier).
 *
 * Run:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/opponentAutoPick.ts <your-user-id>
 *
 * Optional delay (ms) between opponent picks to feel more natural:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/opponentAutoPick.ts <your-user-id> 2000
 */
import { firestore, Collections } from "../admin.js";
import { pick } from "../challenge/lib/pick.js";
import type { SlatePlayer, SlateTier, DraftState, Opponent } from "../types.js";

const POLL_INTERVAL_MS = 1500;

function getBestPick(
  tier: SlateTier,
  players: Record<string, SlatePlayer>,
  rawPicks: Record<string, string> | string[] | undefined,
  rawOpponentPicks: Record<string, string> | string[] | undefined
): SlatePlayer | null {
  const pickedIds = new Set<string>(
    rawPicks ? Object.values(rawPicks) : []
  );
  const opponentPickedIds = new Set<string>(
    rawOpponentPicks ? Object.values(rawOpponentPicks) : []
  );

  const available: SlatePlayer[] = [];

  for (const playerId of tier.players) {
    const player = players[playerId];
    if (!player) continue;
    if (player.picked) continue;
    if (pickedIds.has(playerId)) continue;
    if (opponentPickedIds.has(playerId)) continue;
    available.push(player);
  }

  if (available.length === 0) return null;

  available.sort((a, b) => {
    const aStat = parseFloat(String(a.key_stat ?? 0));
    const bStat = parseFloat(String(b.key_stat ?? 0));
    if (bStat !== aStat) return bStat - aStat;

    const aName = a.last_name || a.name || "";
    const bName = b.last_name || b.name || "";
    if (aName < bName) return 1;
    if (aName > bName) return -1;
    return 0;
  });

  return available[0];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleContest(
  myUserId: string,
  contestId: string,
  contest: any,
  lastPickKeys: Map<string, string>,
  pickDelay: number
): Promise<void> {
  const draft = contest.draft as DraftState;
  const opponent = contest.oppenent as Opponent;

  if (draft.on_the_clock === myUserId) return;

  const opponentId = opponent.id;

  const opponentContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(opponentId)
    .get();
  const opponentData = opponentContestSnap.data();
  const opponentContest = opponentData?.contests?.[contestId];

  if (!opponentContest || opponentContest.stage !== "draft") return;

  const opponentDraft = opponentContest.draft as DraftState;
  if (opponentDraft.on_the_clock !== opponentId) return;

  const tiers = opponentContest.slate.tiers as SlateTier[];
  const players = opponentContest.slate.players as Record<string, SlatePlayer>;
  const currentTier = tiers[opponentDraft.round - 1];

  if (!currentTier) {
    console.error(`[${contestId}] No tier found for round ${opponentDraft.round}`);
    return;
  }

  const bestPick = getBestPick(
    currentTier,
    players,
    opponentContest.picks,
    opponentContest.oppenent?.picks
  );

  if (!bestPick) {
    console.error(`[${contestId}] No available players in round ${opponentDraft.round}`);
    return;
  }

  const pickKey = `${contestId}-${opponentDraft.round}-${bestPick.id}`;
  if (lastPickKeys.get(contestId) === pickKey) return;

  const playerName = bestPick.name
    || `${bestPick.first_name || ""} ${bestPick.last_name || ""}`.trim()
    || bestPick.id;

  if (pickDelay > 0) {
    console.log(
      `[${contestId}] Round ${opponentDraft.round}: ${opponent.display_name} is thinking... (${pickDelay}ms)`
    );
    await sleep(pickDelay);
  }

  console.log(
    `[${contestId}] Round ${opponentDraft.round}: ${opponent.display_name} picks ${playerName} (key_stat: ${bestPick.key_stat ?? "n/a"})`
  );

  const result = await pick(opponentId, bestPick.id, opponentDraft.token, contestId);
  lastPickKeys.set(contestId, pickKey);

  if (result.noop) {
    console.log(`  ↳ noop: ${result.noop}`);
  } else {
    console.log("  ↳ Pick confirmed!");
  }
}

async function run(): Promise<void> {
  const myUserId = process.argv[2];
  if (!myUserId) {
    console.error(
      "Usage: npx ts-node --esm src/scripts/opponentAutoPick.ts <your-user-id> [delay-ms]"
    );
    process.exit(1);
  }

  const pickDelay = parseInt(process.argv[3] || "0", 10);

  console.log(`Watching ALL active drafts for user: ${myUserId}`);
  console.log(`Opponent pick delay: ${pickDelay}ms`);
  console.log(`Polling every ${POLL_INTERVAL_MS}ms — press Ctrl+C to stop.\n`);

  const lastPickKeys = new Map<string, string>();

  while (true) {
    try {
      const contestSnap = await firestore
        .collection(Collections.USER_CONTESTS)
        .doc(myUserId)
        .get();

      const data = contestSnap.data();
      const contests = data?.contests as Record<string, any> | undefined;

      if (!contests) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      const draftEntries = Object.entries(contests).filter(
        ([, c]) => c.stage === "draft"
      );

      if (draftEntries.length === 0) {
        const hasLive = Object.values(contests).some((c: any) => c.stage === "live");
        if (hasLive) {
          console.log("All drafts complete — exiting.");
          process.exit(0);
        }
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      await Promise.all(
        draftEntries.map(([contestId, contest]) =>
          handleContest(myUserId, contestId, contest, lastPickKeys, pickDelay).catch(
            (err) => console.error(`[${contestId}] Error:`, err)
          )
        )
      );
    } catch (err) {
      console.error("Error during poll:", err);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

run().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
