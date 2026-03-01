/**
 * Simulate an opponent joining your draft through the lobby.
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/joinRandomDraft.ts <your-user-id>
 */
import { firestore, Collections } from "../admin.js";
import { joinPublicContestLogic } from "../challenge/lib/joinPublicContest.js";

async function joinRandomDraft(): Promise<void> {
  const myUserId = process.argv[2];
  if (!myUserId) {
    console.error("Usage: npx ts-node --esm src/scripts/joinRandomDraft.ts <your-user-id>");
    process.exit(1);
  }

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(myUserId)
    .get();
  const userContestData = userContestSnap.data();
  let pendingSlateId: string | undefined;

  if (userContestData?.contests) {
    for (const contest of Object.values(userContestData.contests) as any[]) {
      if (contest.stage === "pending") {
        pendingSlateId = contest.slate?.id || contest.slate_id || undefined;
        break;
      }
    }
  }

  const usersSnap = await firestore.collection(Collections.USERS).get();
  const candidates = usersSnap.docs
    .map((doc) => doc.id)
    .filter((id) => id !== myUserId);

  if (candidates.length === 0) {
    console.error("No other users found. Run seedUsers first.");
    process.exit(1);
  }

  const opponentId = candidates[Math.floor(Math.random() * candidates.length)];
  const opponentSnap = await firestore.collection(Collections.USERS).doc(opponentId).get();
  const opponent = opponentSnap.data();

  console.log(`Selected opponent: ${opponent?.display_name} (${opponentId})`);

  if (pendingSlateId) {
    console.log(`Found your pending contest for slate "${pendingSlateId}" — opponent will join via lobby.`);
  } else {
    console.log("No pending contest found — opponent will create a new lobby entry.");
  }

  const slateRef = pendingSlateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(pendingSlateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateRef.get();
  const entryCost = (slateSnap.data()?.entry_cost as number) || 0;

  if (entryCost > 0) {
    const topUp = entryCost * 2;
    console.log(`Slate entry cost is ${entryCost} coins — granting ${topUp} coins to both users.`);
    await Promise.all([
      firestore.collection(Collections.USERS).doc(myUserId).set(
        { coins: topUp },
        { merge: true }
      ),
      firestore.collection(Collections.USERS).doc(opponentId).set(
        { coins: topUp },
        { merge: true }
      ),
    ]);
  }

  const result = await joinPublicContestLogic(opponentId, pendingSlateId);

  if (result.error || result.noop) {
    console.error("Join failed:", result.error || result.noop);
    process.exit(1);
  }

  if (result.game_created) {
    console.log(`Draft created! Contest ID: ${result.contest_id}`);
    console.log(`${opponent?.display_name} matched with you through the lobby.`);
  } else if (result.added) {
    console.log(`${opponent?.display_name} added to lobby, waiting for a match. Contest ID: ${result.contest_id}`);
    console.log("Run the script again with a different user to complete the match.");
  }
}

joinRandomDraft().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error joining random draft:", e);
  process.exit(1);
});
