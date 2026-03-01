import { firestore, Collections } from "../../admin.js";
import type { LeaderboardEntry } from "../../types.js";

export async function updateLeaderboard(): Promise<LeaderboardEntry[]> {
  const userRefs = await firestore.collection(Collections.USERS).get();
  const users = userRefs.docs.map((d) => d.data());

  const getUserRecords: Array<Promise<FirebaseFirestore.QuerySnapshot>> = [];
  const getUserArchivedContests: Array<Promise<FirebaseFirestore.QuerySnapshot>> = [];

  for (const user of users) {
    getUserRecords.push(
      firestore.collection(Collections.USERS).doc(user.id).collection("RECORDS").get()
    );
    getUserArchivedContests.push(
      firestore
        .collection(Collections.USERS)
        .doc(user.id)
        .collection("CONTEST_ARCHIVES")
        .get()
    );
  }

  const [userRecords, userArchives] = await Promise.all([
    Promise.all(getUserRecords),
    Promise.all(getUserArchivedContests),
  ]);

  const userForRecord: Record<string, Array<Record<string, unknown>>> = {};
  const userForArchive: Record<string, Array<Record<string, unknown>>> = {};

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    userForRecord[user.id] = userRecords[i].docs.map((d) => d.data());
    userForArchive[user.id] = userArchives[i].docs.map((d) => d.data());
  }

  const sortUsers: LeaderboardEntry[] = [];

  for (const user of users) {
    let tiersWon = 0;
    const record = { wins: 0, losses: 0 };
    let gamesCount = 0;
    let sortVal = 0;
    let recordCount = 0;
    let winPercentage = 0;

    const currentRecords = userForRecord[user.id];
    const contestArchive = userForArchive[user.id];

    if (!currentRecords.length) continue;

    for (const currentRecord of currentRecords) {
      const wins = Number(currentRecord.wins);
      const losses = Number(currentRecord.losses);
      record.wins = wins + record.wins;
      record.losses = losses + record.losses;
    }

    recordCount = record.wins - record.losses;
    gamesCount = record.wins + record.losses;
    winPercentage = gamesCount * (record.wins / gamesCount);
    sortVal = sortVal + gamesCount + recordCount;

    for (const currentContest of contestArchive) {
      const won = Number(currentContest.tiers_won);
      tiersWon = tiersWon + won;
    }

    sortUsers.push({
      tiers_won: tiersWon,
      record,
      games_count: gamesCount,
      record_count: recordCount,
      win_percentage: winPercentage,
      user: {
        avatar: (user.avatar as string) || "fan_guy",
        display_name: (user.display_name as string) || (user.email as string),
        id: user.id as string,
      },
      sort_val: sortVal,
    });
  }

  const orderedLeaderboard = sortUsers.sort((a, b) => {
    if (a.win_percentage < b.win_percentage) return 1;
    if (a.win_percentage > b.win_percentage) return -1;
    if (a.games_count < b.games_count) return 1;
    if (a.games_count > b.games_count) return -1;
    if (a.record_count < b.record_count) return 1;
    if (a.record_count > b.record_count) return -1;
    if (a.tiers_won < b.tiers_won) return 1;
    if (a.tiers_won > b.tiers_won) return -1;
    if (a.user.display_name > b.user.display_name) return 1;
    if (a.user.display_name < b.user.display_name) return -1;
    return 0;
  });

  try {
    await firestore
      .collection(Collections.LEADERBOARD)
      .doc("current")
      .set({ entries: orderedLeaderboard.slice(0, 100) });
  } catch (e) {
    console.error("Failed to write leaderboard:", e);
  }

  return orderedLeaderboard;
}
