/**
 * Simulate an opponent joining your draft.
 * Directly calls joinContest (bypasses the lobby) so the match always
 * involves YOUR user regardless of lobby state.
 *
 * Run: npm run script:join-draft -- <your-user-id>
 */
import { firestore, Collections } from "../admin.js";
import { joinContest } from "../challenge/lib/joinContest.js";
import { creditCoins } from "../challenge/lib/coins.js";

async function joinRandomDraft(): Promise<void> {
  const myUserId = process.argv[2];
  if (!myUserId) {
    console.error("Usage: npm run script:join-draft -- <your-user-id>");
    process.exit(1);
  }

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(myUserId)
    .get();
  const userContestData = userContestSnap.data();
  let pendingContestId: string | undefined;
  let pendingSlateId: string | undefined;

  if (userContestData?.contests) {
    for (const [cId, contest] of Object.entries(userContestData.contests) as [string, any][]) {
      if (contest.stage === "pending") {
        pendingContestId = cId;
        pendingSlateId = contest.slate?.id || contest.slate_id || undefined;
        break;
      }
    }
  }

  if (!pendingContestId) {
    console.error("No pending contest found for your user. Join a contest from the app first.");
    process.exit(1);
  }

  console.log(`Found pending contest ${pendingContestId} for slate "${pendingSlateId}"`);

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

  const slateRef = pendingSlateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(pendingSlateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateRef.get();
  const slateData = slateSnap.data();
  const entryCost = (slateData?.entry_cost as number) || 0;
  const MIN_BALANCE = Math.max(entryCost * 2, 500);

  console.log(`Slate entry_cost=${slateData?.entry_cost} (resolved entryCost=${entryCost}), MIN_BALANCE=${MIN_BALANCE}`);

  const [mySnap, oppSnap] = await Promise.all([
    firestore.collection(Collections.USERS).doc(myUserId).get(),
    firestore.collection(Collections.USERS).doc(opponentId).get(),
  ]);
  const myCoins = (mySnap.data()?.coins as number) ?? 0;
  const oppCoins = (oppSnap.data()?.coins as number) ?? 0;

  console.log(`Your coins: ${myCoins}, Opponent coins: ${oppCoins}`);

  const topUps: Promise<void>[] = [];
  if (myCoins < MIN_BALANCE) {
    const needed = MIN_BALANCE - myCoins;
    console.log(`You have ${myCoins} coins — crediting ${needed} bonus coins (target ${MIN_BALANCE}).`);
    topUps.push(creditCoins(myUserId, needed, { type: "bonus" }));
  }
  if (oppCoins < MIN_BALANCE) {
    const needed = MIN_BALANCE - oppCoins;
    console.log(`Opponent has ${oppCoins} coins — crediting ${needed} bonus coins (target ${MIN_BALANCE}).`);
    topUps.push(creditCoins(opponentId, needed, { type: "bonus" }));
  }
  if (topUps.length > 0) {
    await Promise.all(topUps);
    console.log("Coin top-ups complete.");
  } else {
    console.log("Both users have enough coins, no top-up needed.");
  }

  // Clean up the lobby entry for this slate so it doesn't go stale
  const lobbyDocId = pendingSlateId || "WAITING";
  await firestore.collection(Collections.PUBLIC_LOBBY).doc(lobbyDocId).delete();
  console.log(`Cleaned up lobby entry (${lobbyDocId}).`);

  // The user who was waiting in the lobby was already charged on the "new" path,
  // so mark them as pre-deducted to avoid double-charging.
  console.log(`Calling joinContest directly: user=${opponentId}, opponent=${myUserId}, contestId=${pendingContestId}`);
  const cId = await joinContest(
    opponentId,
    myUserId,
    undefined,
    pendingSlateId,
    pendingContestId,
    [myUserId]
  );

  console.log(`Draft created! Contest ID: ${cId}`);
  console.log(`${opponent?.display_name} matched with you. Check the app — draft should be active.`);
}

joinRandomDraft().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error joining random draft:", e);
  process.exit(1);
});
