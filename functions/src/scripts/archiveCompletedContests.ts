/**
 * Archive all live-stage contests. Finds every USER_CONTESTS entry with
 * stage === "live", scores them, writes enriched archives to CONTEST_ARCHIVES,
 * credits payouts to winners, updates win/loss records, and removes the
 * contest from USER_CONTESTS for both users.
 *
 * All Firestore writes (archives + deletes) go through a single batch so
 * nothing is partially committed.
 *
 * Run: npm run script:archive-contests
 */
import { firestore, Collections } from "../admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { Batch } from "../utils/Batch.js";
import { creditCoins } from "../challenge/lib/coins.js";

interface SlatePlayerData {
  score: number;
  tie_breaker: number;
  [key: string]: unknown;
}

async function updateRecords(
  winner: string,
  loser: string,
  batch: Batch
): Promise<void> {
  const fs = batch.firestore;

  const winsSnap = await fs
    .collection(Collections.USERS)
    .doc(winner)
    .collection("RECORDS")
    .doc(loser)
    .get();

  const winsVal = winsSnap.data();
  if (!winsVal) {
    batch.set(
      fs.collection(Collections.USERS).doc(winner).collection("RECORDS").doc(loser),
      { wins: 1, losses: 0 }
    );
  } else {
    batch.update(
      fs.collection(Collections.USERS).doc(winner).collection("RECORDS").doc(loser),
      { wins: (winsVal.wins ?? 0) + 1 }
    );
  }

  const lossesSnap = await fs
    .collection(Collections.USERS)
    .doc(loser)
    .collection("RECORDS")
    .doc(winner)
    .get();

  const lossesVal = lossesSnap.data();
  if (!lossesVal) {
    batch.set(
      fs.collection(Collections.USERS).doc(loser).collection("RECORDS").doc(winner),
      { wins: 0, losses: 1 }
    );
  } else {
    batch.update(
      fs.collection(Collections.USERS).doc(loser).collection("RECORDS").doc(winner),
      { losses: (lossesVal.losses ?? 0) + 1 }
    );
  }
}

function scoreAndArchiveContest(params: {
  userContest: Record<string, unknown>;
  opponentContest: Record<string, unknown> | undefined;
  contestId: string;
  userId: string;
  opponentId: string;
  batch: Batch;
  userDocExists: boolean;
  opponentDocExists: boolean;
}): { winnerId: string; loserId: string; payout: number } | null {
  const {
    userContest,
    opponentContest,
    contestId,
    userId,
    opponentId,
    batch,
    userDocExists,
    opponentDocExists,
  } = params;
  const fs = batch.firestore;
  const prefix = `contests.${contestId}`;

  const picksRaw = userContest.picks as Record<string, string> | string[] | undefined;
  const picks = picksRaw
    ? Array.isArray(picksRaw)
      ? picksRaw
      : Object.keys(picksRaw)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => (picksRaw as Record<string, string>)[k])
    : [];

  if (!picks.length) {
    console.log(`  Contest ${contestId}: no picks, removing without archiving.`);
    if (userDocExists) {
      batch.update(
        fs.collection(Collections.USER_CONTESTS).doc(userId),
        { [prefix]: FieldValue.delete() }
      );
    }
    if (opponentDocExists) {
      batch.update(
        fs.collection(Collections.USER_CONTESTS).doc(opponentId),
        { [prefix]: FieldValue.delete() }
      );
    }
    return null;
  }

  const slate = userContest.slate as Record<string, unknown>;
  const slatePlayers = slate.players as Record<string, SlatePlayerData>;
  const oppenent = userContest.oppenent as Record<string, unknown>;
  const oppPicksRaw = oppenent.picks as Record<string, string> | string[] | undefined;
  const opponentPicks = oppPicksRaw
    ? Array.isArray(oppPicksRaw)
      ? oppPicksRaw
      : Object.keys(oppPicksRaw)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => (oppPicksRaw as Record<string, string>)[k])
    : [];

  const tiers = { user: 0, opponent: 0 };
  for (let j = 0; j < picks.length; j++) {
    const userPick = picks[j];
    const oppPick = opponentPicks[j];
    if (!userPick || !oppPick) continue;
    const uScore = Number(slatePlayers[userPick]?.score ?? 0);
    const oScore = Number(slatePlayers[oppPick]?.score ?? 0);
    const uTB = Number(slatePlayers[userPick]?.tie_breaker ?? 0);
    const oTB = Number(slatePlayers[oppPick]?.tie_breaker ?? 0);

    if (uScore > oScore) {
      tiers.user++;
    } else if (uScore === oScore) {
      if (uTB < oTB) tiers.user++;
      else tiers.opponent++;
    } else {
      tiers.opponent++;
    }
  }

  const winnerId = tiers.user > tiers.opponent ? userId : opponentId;
  const loserId = winnerId === userId ? opponentId : userId;

  const archiveExtras = {
    entry_cost: (slate.entry_cost as number) ?? 0,
    payout: (slate.payout as number) ?? 0,
    slate_name: (userContest.slate_name as string) ?? "",
    slate_id: (slate.id as string) ?? "",
    sport: (slate.sport as string) ?? "",
  };

  batch.set(
    fs.collection(Collections.USERS).doc(userId).collection("CONTEST_ARCHIVES").doc(contestId),
    {
      ...userContest,
      ...archiveExtras,
      id: contestId,
      user_won: winnerId === userId,
      tiers_won: tiers.user,
      opponent_tiers_won: tiers.opponent,
      created_at: new Date(),
    }
  );

  if (opponentContest) {
    batch.set(
      fs.collection(Collections.USERS).doc(opponentId).collection("CONTEST_ARCHIVES").doc(contestId),
      {
        ...opponentContest,
        ...archiveExtras,
        id: contestId,
        user_won: winnerId === opponentId,
        tiers_won: tiers.opponent,
        opponent_tiers_won: tiers.user,
        created_at: new Date(),
      }
    );
  }

  if (userDocExists) {
    batch.update(
      fs.collection(Collections.USER_CONTESTS).doc(userId),
      { [prefix]: FieldValue.delete() }
    );
  }
  if (opponentDocExists) {
    batch.update(
      fs.collection(Collections.USER_CONTESTS).doc(opponentId),
      { [prefix]: FieldValue.delete() }
    );
  }

  const payout = (slate.payout as number) ?? 0;
  console.log(
    `  Contest ${contestId}: scored. Winner=${winnerId}, Tiers=${tiers.user}-${tiers.opponent}, Payout=${payout}`
  );

  return { winnerId, loserId, payout };
}

async function archiveCompletedContests(): Promise<void> {
  const batch = new Batch(firestore);

  const userContestsSnap = await firestore.collection(Collections.USER_CONTESTS).get();

  if (userContestsSnap.empty) {
    console.log("No user contests found.");
    return;
  }

  const contestsByUser: Record<string, Record<string, unknown>> = {};
  const existingUserDocs = new Set<string>();
  for (const doc of userContestsSnap.docs) {
    contestsByUser[doc.id] = doc.data();
    existingUserDocs.add(doc.id);
  }

  const scoredContests = new Set<string>();
  const payouts: Array<{ winnerId: string; loserId: string; payout: number; slateId: string }> = [];
  let archiveCount = 0;

  for (const userId of Object.keys(contestsByUser)) {
    const userData = contestsByUser[userId];
    const contests = userData.contests as Record<string, Record<string, unknown>> | undefined;
    if (!contests) continue;

    for (const [contestId, contest] of Object.entries(contests)) {
      if (scoredContests.has(contestId)) continue;

      if (contest.stage !== "live") {
        console.log(`  Skipping ${contestId} for ${userId}: stage=${contest.stage}`);
        continue;
      }

      const slate = contest.slate as Record<string, unknown> | undefined;
      if (!slate) {
        console.log(`  Skipping ${contestId} for ${userId}: no slate data`);
        continue;
      }

      if (!contest.oppenent) {
        console.log(`  Skipping ${contestId} for ${userId}: no opponent`);
        continue;
      }

      scoredContests.add(contestId);

      const oppenent = contest.oppenent as Record<string, unknown>;
      const opponentId = oppenent.id as string;

      const opponentContest = (
        contestsByUser[opponentId]?.contests as Record<string, Record<string, unknown>> | undefined
      )?.[contestId];

      console.log(
        `Found live contest ${contestId} (slate=${slate.id}) for ${userId} vs ${opponentId}`
      );

      const result = scoreAndArchiveContest({
        userContest: contest,
        opponentContest,
        contestId,
        userId,
        opponentId,
        batch,
        userDocExists: existingUserDocs.has(userId),
        opponentDocExists: existingUserDocs.has(opponentId),
      });

      if (result) {
        archiveCount++;
        try {
          await updateRecords(result.winnerId, result.loserId, batch);
        } catch (e) {
          console.warn(`  Contest ${contestId}: updateRecords failed:`, e);
        }
        if (result.payout > 0) {
          payouts.push({
            winnerId: result.winnerId,
            loserId: result.loserId,
            payout: result.payout,
            slateId: (slate.id as string) ?? "",
          });
        }
      }
    }
  }

  if (archiveCount === 0) {
    console.log("No live contests to archive.");
    return;
  }

  console.log(`\nCommitting batch (${archiveCount} contest(s))...`);
  await batch.write();
  console.log("Batch committed successfully.");

  for (const p of payouts) {
    try {
      await creditCoins(p.winnerId, p.payout, {
        type: "payout",
        contest_id: p.slateId,
        opponent_id: p.loserId,
      });
      console.log(`  Credited ${p.payout} coins to winner ${p.winnerId}`);
    } catch (e) {
      console.error(`  Failed to credit payout to ${p.winnerId}:`, e);
    }
  }

  console.log(`\nArchived ${archiveCount} contest(s).`);
}

archiveCompletedContests()
  .then(() => {
    console.log("Archive completed contests script finished.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error archiving contests:", e);
    process.exit(1);
  });
