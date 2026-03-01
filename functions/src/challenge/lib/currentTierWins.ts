import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, Collections } from "../../admin.js";
import type { TierWinEntry } from "../../types.js";

export async function currentTierWins(): Promise<void> {
  const userContestsSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .get();

  const usersTierWins: TierWinEntry[] = [];

  for (const doc of userContestsSnap.docs) {
    const data = doc.data();
    const contests = data.contests as Record<string, Record<string, unknown>> | undefined;
    if (!contests) continue;

    for (const currentContest of Object.values(contests)) {
      if (!currentContest || currentContest.stage !== "live") continue;

      let userTier = 0;
      const slate = currentContest.slate as Record<string, unknown>;
      const players = slate.players as Record<string, Record<string, unknown>>;
      const picks = currentContest.picks as string[];
      const oppenent = currentContest.oppenent as Record<string, unknown>;
      const opponentPicks = oppenent.picks as string[];

      if (!picks || !opponentPicks) continue;

      for (let j = 0; j < picks.length; j++) {
        const userPick = picks[j];
        const opponentPick = opponentPicks[j];
        const userScore = Number(players[userPick].score);
        const userScored = players[userPick].scored;
        const opponentScore = Number(players[opponentPick].score);
        const userTieBreaker = players[userPick].tie_breaker;
        const opponentTieBreaker = players[opponentPick].tie_breaker;

        if (userScored && userScore > opponentScore) {
          userTier++;
        } else if (userScored && userScore === opponentScore) {
          if ((userTieBreaker as number) > (opponentTieBreaker as number)) {
            userTier++;
          }
        }
      }

      const userInfoVal = await checkUserId(doc.id);

      if (userInfoVal) {
        usersTierWins.push({
          tiers_won: userTier,
          user: {
            avatar: userInfoVal.avatar || "",
            id: doc.id,
            display_name: userInfoVal.display_name || "",
          },
        });
      } else {
        console.log("No Data For", doc.id);
      }
    }
  }

  const orderedUsersTierWins = usersTierWins.sort((a, b) => {
    if (a.tiers_won < b.tiers_won) return 1;
    if (a.tiers_won > b.tiers_won) return -1;
    if (a.user.display_name.toLowerCase() > b.user.display_name.toLowerCase())
      return 1;
    if (a.user.display_name.toLowerCase() < b.user.display_name.toLowerCase())
      return -1;
    return 0;
  });

  try {
    await firestore
      .collection(Collections.USER_TIER_WINS)
      .doc("current")
      .set({ entries: orderedUsersTierWins });
  } catch (e) {
    console.error("Failed to write tier wins:", e);
  }
}
