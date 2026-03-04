import { firestore, Collections } from "../../admin.js";
import { pick } from "./pick.js";
import { getBestPick } from "./getBestPick.js";
import type { SlatePlayer } from "../../types.js";

const BOT_PICK_DELAY_MS = 5_000;
const MAX_ROUNDS = 12;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rapidly auto-drafts for a bot user in the given contest.
 * Loops until the draft completes or the human is on the clock,
 * then waits for the human to pick (handled by the normal autoPickTask
 * draft-clock flow) and resumes when the bot is back on the clock.
 */
export async function autoDraftForBot(
  botId: string,
  contestId: string
): Promise<void> {
  const tag = `[autoDraftForBot][bot=${botId}][contest=${contestId}]`;
  console.log(`${tag} Starting auto-draft loop.`);

  for (let attempt = 0; attempt < MAX_ROUNDS; attempt++) {
    await sleep(BOT_PICK_DELAY_MS);

    const botContestSnap = await firestore
      .collection(Collections.USER_CONTESTS)
      .doc(botId)
      .get();
    const botData = botContestSnap.data();
    const contest = botData?.contests?.[contestId] as
      | Record<string, unknown>
      | undefined;

    if (!contest) {
      console.log(`${tag} Contest no longer exists for bot, stopping.`);
      return;
    }

    if (contest.stage !== "draft") {
      console.log(`${tag} Contest stage is "${contest.stage}", draft complete.`);
      return;
    }

    const draft = contest.draft as Record<string, unknown>;
    if (!draft) {
      console.log(`${tag} No draft state, stopping.`);
      return;
    }

    if ((draft.on_the_clock as string) !== botId) {
      console.log(`${tag} Human is on the clock, leaving to autoPickTask.`);
      return;
    }

    const slate = contest.slate as Record<string, unknown>;
    const tiers = slate.tiers as Array<{ players: string[] }>;
    const players = slate.players as Record<string, SlatePlayer>;
    const round = draft.round as number;

    const currentTier = tiers[round - 1];
    if (!currentTier) {
      console.error(`${tag} No tier for round ${round}, stopping.`);
      return;
    }

    const bestPick = getBestPick(currentTier, players, contest);
    if (!bestPick) {
      console.error(`${tag} No available player in round ${round}, stopping.`);
      return;
    }

    const token = draft.token as string;
    const playerName =
      bestPick.name ||
      `${bestPick.first_name ?? ""} ${bestPick.last_name ?? ""}`.trim() ||
      bestPick.id;

    console.log(`${tag} Round ${round}: picking ${playerName} (key_stat: ${bestPick.key_stat ?? "n/a"})`);
    const result = await pick(botId, bestPick.id, token, contestId);

    if (result.noop) {
      console.log(`${tag} pick noop: ${result.noop}`);
      if (result.noop === "Draft has ended") return;
    } else {
      console.log(`${tag} pick confirmed.`);
    }
  }

  console.log(`${tag} Reached max attempts (${MAX_ROUNDS}), exiting.`);
}
