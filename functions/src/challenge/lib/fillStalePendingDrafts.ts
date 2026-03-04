import { firestore, Collections } from "../../admin.js";
import { joinContest } from "./joinContest.js";
import { creditCoins } from "./coins.js";
import { autoDraftForBot } from "./autoDraftForBot.js";

const STALE_THRESHOLD_MS = 5 * 60 * 1000;

export async function fillStalePendingDrafts(): Promise<void> {
  const userContestsSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .get();

  if (userContestsSnap.empty) {
    console.log("[fillStalePending] No user contests found.");
    return;
  }

  const now = Date.now();

  interface PendingEntry {
    userId: string;
    contestId: string;
    slateId: string | undefined;
    createdAt: string;
  }

  const pendingEntries: PendingEntry[] = [];
  const seenContests = new Set<string>();

  for (const doc of userContestsSnap.docs) {
    const data = doc.data();
    const contests = data.contests as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!contests) continue;

    for (const [contestId, contest] of Object.entries(contests)) {
      if (contest.stage !== "pending") continue;
      if (seenContests.has(contestId)) continue;
      seenContests.add(contestId);

      const createdAt = contest.created_at as string | undefined;
      if (!createdAt) {
        console.log(
          `[fillStalePending] Contest ${contestId} has no created_at, skipping.`
        );
        continue;
      }

      const age = now - new Date(createdAt).getTime();
      if (age < STALE_THRESHOLD_MS) continue;

      pendingEntries.push({
        userId: doc.id,
        contestId,
        slateId: (contest.slate_id as string) || (contest.slate as Record<string, unknown>)?.id as string | undefined,
        createdAt,
      });
    }
  }

  if (pendingEntries.length === 0) {
    console.log("[fillStalePending] No stale pending contests found.");
    return;
  }

  console.log(
    `[fillStalePending] Found ${pendingEntries.length} stale pending contest(s).`
  );

  const usersSnap = await firestore.collection(Collections.USERS).get();
  const allUserIds = usersSnap.docs.map((d) => d.id);

  for (const entry of pendingEntries) {
    try {
      await fillOnePending(entry, allUserIds);
    } catch (err) {
      console.error(
        `[fillStalePending] Failed to fill contest ${entry.contestId}:`,
        err
      );
    }
  }
}

async function fillOnePending(
  entry: {
    userId: string;
    contestId: string;
    slateId: string | undefined;
    createdAt: string;
  },
  allUserIds: string[]
): Promise<void> {
  const { userId, contestId, slateId } = entry;
  const tag = `[fillStalePending][contest=${contestId}]`;

  const candidates = allUserIds.filter((id) => id !== userId);
  if (candidates.length === 0) {
    console.error(`${tag} No candidate users found. Run seedUsers first.`);
    return;
  }

  const botId = candidates[Math.floor(Math.random() * candidates.length)];
  console.log(`${tag} Selected bot: ${botId} for user ${userId}`);

  const slateRef = slateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(slateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateRef.get();
  const slateData = slateSnap.data();
  const entryCost = (slateData?.entry_cost as number) || 0;

  if (entryCost > 0) {
    const botSnap = await firestore
      .collection(Collections.USERS)
      .doc(botId)
      .get();
    const botCoins = (botSnap.data()?.coins as number) ?? 0;
    if (botCoins < entryCost) {
      const needed = entryCost - botCoins;
      console.log(
        `${tag} Bot ${botId} has ${botCoins} coins, needs ${entryCost}. Crediting ${needed}.`
      );
      await creditCoins(botId, needed, { type: "bonus" });
    }
  }

  const lobbyDocId = slateId || "WAITING";
  await firestore
    .collection(Collections.PUBLIC_LOBBY)
    .doc(lobbyDocId)
    .delete();
  console.log(`${tag} Cleaned up lobby entry (${lobbyDocId}).`);

  const cId = await joinContest(
    botId,
    userId,
    undefined,
    slateId,
    contestId,
    [userId]
  );

  console.log(`${tag} Draft created with contest ID ${cId}. Marking bot_user_id.`);

  const prefix = `contests.${cId}`;
  await Promise.all([
    firestore
      .collection(Collections.USER_CONTESTS)
      .doc(userId)
      .update({ [`${prefix}.bot_user_id`]: botId }),
    firestore
      .collection(Collections.USER_CONTESTS)
      .doc(botId)
      .update({ [`${prefix}.bot_user_id`]: botId }),
  ]);

  console.log(`${tag} Starting auto-draft for bot.`);
  await autoDraftForBot(botId, cId);
}
