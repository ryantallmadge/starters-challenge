import { Batch } from "../../utils/Batch.js";
import { firestore, messaging, Collections } from "../../admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { creditCoins } from "./coins.js";

async function updateRecords(
  winner: string,
  loser: string,
  batch: Batch
): Promise<void> {
  const fs = batch.firestore;

  const currentWins = await fs
    .collection(Collections.USERS)
    .doc(winner)
    .collection("RECORDS")
    .doc(loser)
    .get();

  const currentWinsVal = currentWins.data();
  if (!currentWinsVal) {
    batch.set(
      fs.collection(Collections.USERS).doc(winner).collection("RECORDS").doc(loser),
      { wins: 1, losses: 0 }
    );
  } else {
    batch.update(
      fs.collection(Collections.USERS).doc(winner).collection("RECORDS").doc(loser),
      { wins: currentWinsVal.wins + 1 }
    );
  }

  const currentLosses = await fs
    .collection(Collections.USERS)
    .doc(loser)
    .collection("RECORDS")
    .doc(winner)
    .get();

  const currentLossesVal = currentLosses.data();
  if (!currentLossesVal) {
    batch.set(
      fs.collection(Collections.USERS).doc(loser).collection("RECORDS").doc(winner),
      { wins: 0, losses: 1 }
    );
  } else {
    batch.update(
      fs.collection(Collections.USERS).doc(loser).collection("RECORDS").doc(winner),
      { losses: currentLossesVal.losses + 1 }
    );
  }
}

async function scoreContest(params: {
  currentContest: Record<string, unknown>;
  contestId: string;
  userId: string;
  opponentId: string;
  batch: Batch;
}): Promise<{ winner_id?: string } | undefined> {
  const { currentContest, contestId, userId, opponentId, batch } = params;
  const fs = batch.firestore;

  const tiers = { user: 0, oppenent: 0 };
  const prefix = `contests.${contestId}`;

  if (currentContest.stage === "draft") {
    await Promise.all([
      firestore.collection(Collections.USER_CONTESTS).doc(userId).update({
        [prefix]: FieldValue.delete(),
      }),
      firestore.collection(Collections.USER_CONTESTS).doc(opponentId).update({
        [prefix]: FieldValue.delete(),
      }),
    ]);
    return;
  }

  const picksRaw = currentContest.picks as Record<string, string> | string[] | undefined;
  const picks = picksRaw
    ? Array.isArray(picksRaw)
      ? picksRaw
      : Object.keys(picksRaw)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => (picksRaw as Record<string, string>)[k])
    : [];
  if (!picks.length) return;

  const slate = currentContest.slate as Record<string, unknown>;
  const slatePlayers = slate.players as Record<string, Record<string, unknown>>;
  const oppenent = currentContest.oppenent as Record<string, unknown>;
  const oppPicksRaw = oppenent.picks as Record<string, string> | string[] | undefined;
  const opponentPicks = oppPicksRaw
    ? Array.isArray(oppPicksRaw)
      ? oppPicksRaw
      : Object.keys(oppPicksRaw)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => (oppPicksRaw as Record<string, string>)[k])
    : [];

  for (let j = 0; j < picks.length; j++) {
    const userPick = picks[j];
    const opponentPick = opponentPicks[j];
    const userScore = Number(slatePlayers[userPick].score);
    const opponentScore = Number(slatePlayers[opponentPick].score);
    const userTieBreaker = slatePlayers[userPick].tie_breaker as number;
    const opponentTieBreaker = slatePlayers[opponentPick].tie_breaker as number;

    if (userScore > opponentScore) {
      tiers.user++;
    } else if (userScore === opponentScore) {
      if (userTieBreaker < opponentTieBreaker) {
        tiers.user++;
      } else {
        tiers.oppenent++;
      }
    } else {
      tiers.oppenent++;
    }
  }

  let winnerId: string;
  let loserId: string;
  if (tiers.user > tiers.oppenent) {
    await updateRecords(userId, opponentId, batch);
    winnerId = userId;
    loserId = opponentId;
  } else {
    await updateRecords(opponentId, userId, batch);
    winnerId = opponentId;
    loserId = userId;
  }

  const payout = slate.payout as number | undefined;
  if (payout && payout > 0) {
    try {
      await creditCoins(winnerId, payout, {
        type: "payout",
        contest_id: slate.id as string | undefined,
        opponent_id: loserId,
      });
    } catch (e) {
      console.error("Failed to credit payout coins:", e);
    }
  }

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(userId)
    .get();
  const userArchiveVal = userContestSnap.data()?.contests?.[contestId];
  if (!userArchiveVal) return;

  const opponentContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(opponentId)
    .get();
  const opponentArchiveVal = opponentContestSnap.data()?.contests?.[contestId];

  const archiveExtras = {
    user_won: true,
    entry_cost: (slate.entry_cost as number) ?? 0,
    payout: (slate.payout as number) ?? 0,
    slate_name: (currentContest.slate_name as string) ?? "",
    slate_id: (slate.id as string) ?? "",
    sport: (slate.sport as string) ?? "",
  };

  batch.set(
    fs
      .collection(Collections.USERS)
      .doc(userId)
      .collection("CONTEST_ARCHIVES")
      .doc(contestId),
    {
      ...userArchiveVal,
      ...archiveExtras,
      user_won: winnerId === userId,
      tiers_won: tiers.user,
      opponent_tiers_won: tiers.oppenent,
      created_at: new Date(),
    }
  );
  batch.set(
    fs
      .collection(Collections.USERS)
      .doc(opponentId)
      .collection("CONTEST_ARCHIVES")
      .doc(contestId),
    {
      ...opponentArchiveVal,
      ...archiveExtras,
      user_won: winnerId === opponentId,
      tiers_won: tiers.oppenent,
      opponent_tiers_won: tiers.user,
      created_at: new Date(),
    }
  );

  await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).doc(userId).update({
      [prefix]: FieldValue.delete(),
    }),
    firestore.collection(Collections.USER_CONTESTS).doc(opponentId).update({
      [prefix]: FieldValue.delete(),
    }),
  ]);

  return { winner_id: winnerId };
}

export async function runStandings(): Promise<void> {
  const batch = new Batch(firestore);

  const [userContestsSnap, liveSlateSnap, currentSlateSnap] = await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).get(),
    firestore.collection(Collections.SLATES).doc("live").get(),
    firestore.collection(Collections.SLATES).doc("current").get(),
  ]);

  const liveSlateVal = liveSlateSnap.data();
  const currentSlateVal = currentSlateSnap.data();

  if (!liveSlateVal || userContestsSnap.empty) return;

  const tierWinsSnap = await firestore
    .collection(Collections.USER_TIER_WINS)
    .doc("current")
    .get();

  await firestore.collection(Collections.TIER_WINS).doc(liveSlateVal.id).set({
    created: new Date(),
    ...(tierWinsSnap.data() ?? {}),
  });

  const scoreContests: Array<Promise<{ winner_id?: string } | undefined>> = [];
  const scoredContests = new Set<string>();

  const contestsByUser: Record<string, Record<string, unknown>> = {};
  for (const doc of userContestsSnap.docs) {
    contestsByUser[doc.id] = doc.data();
  }

  for (const userId of Object.keys(contestsByUser)) {
    const userData = contestsByUser[userId];
    const contests = userData.contests as Record<string, Record<string, unknown>> | undefined;
    if (!contests) continue;

    for (const [contestId, currentContest] of Object.entries(contests)) {
      if (scoredContests.has(contestId)) continue;
      scoredContests.add(contestId);

      if (!currentContest?.oppenent) continue;

      const oppenent = currentContest.oppenent as Record<string, unknown>;
      const opponentId = oppenent.id as string;

      if (!currentContest.slate || !liveSlateVal) continue;
      const slate = currentContest.slate as Record<string, unknown>;
      if (slate.id !== liveSlateVal.id) continue;

      scoreContests.push(
        scoreContest({ currentContest, contestId, opponentId, userId, batch })
      );
    }
  }

  await Promise.all(scoreContests);

  batch.set(
    batch.firestore.collection(Collections.ARCHIVE_SLATES).doc(liveSlateVal.id),
    { ...liveSlateVal }
  );

  await batch.write();

  if (currentSlateVal) {
    await firestore
      .collection(Collections.SLATES)
      .doc("live")
      .set({ ...currentSlateVal });
  }

  const allUsers = new Set<string>();
  for (const userId of Object.keys(contestsByUser)) {
    allUsers.add(userId);
  }

  const getUsersForMessage = await Promise.all(
    Array.from(allUsers).map((id) =>
      firestore.collection(Collections.USERS).doc(id).get()
    )
  );

  const messageTokens: string[] = [];
  for (const ref of getUsersForMessage) {
    const data = ref.data();
    if (data?.message_token) {
      messageTokens.push(data.message_token);
    }
  }

  for (const token of messageTokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: "Today's contest is now available!",
          body: "Start your draft now!",
        },
      });
    } catch (e) {
      console.error("Failed to send standings notification:", e);
    }
  }
}
