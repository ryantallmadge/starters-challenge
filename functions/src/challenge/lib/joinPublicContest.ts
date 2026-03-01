import { v4 as uuidv4 } from "uuid";
import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, Collections } from "../../admin.js";
import { joinContest } from "./joinContest.js";
import { deductCoins } from "./coins.js";

export async function joinPublicContestLogic(
  userId: string,
  slateId?: string
): Promise<{
  noop?: string;
  stage?: string;
  added?: boolean;
  game_created?: boolean;
  contest_id?: string;
  error?: string;
}> {
  const tag = `[joinPublicContest][user=${userId}][slate=${slateId ?? "none"}]`;
  console.log(`${tag} START`);

  const checkUser = await checkUserId(userId);
  if (!checkUser) {
    console.log(`${tag} NOOP: user does not exist`);
    return { noop: "User does not exist" };
  }

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(userId)
    .get();
  const userContestData = userContestSnap.data();
  console.log(`${tag} existing user_contests keys: ${userContestData?.contests ? Object.keys(userContestData.contests).length : 0}`);

  const slateRef = slateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(slateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateRef.get();
  const slateData = slateSnap.data();
  const entryCost = slateData?.entry_cost as number | undefined;
  const singleEntry = slateData?.single_entry as boolean | undefined;

  if (userContestData?.contests && slateId) {
    for (const [key, contest] of Object.entries(userContestData.contests) as [string, any][]) {
      const contestSlateId = contest.slate?.id || contest.slate_id;
      console.log(`${tag} checking existing contest ${key}: slateId=${contestSlateId}, stage=${contest.stage}`);
      if (contestSlateId === slateId) {
        if (singleEntry) {
          console.log(`${tag} NOOP: single_entry slate — user already entered via contest ${key}`);
          return { noop: "You have already entered this daily challenge" };
        }
        if (contest.stage === "draft" || contest.stage === "pending") {
          console.log(`${tag} NOOP: already has active contest ${key} for this slate`);
          return { noop: "You already have an active contest for this slate" };
        }
      }
    }
  }
  console.log(`${tag} slateExists=${slateSnap.exists}, entryCost=${entryCost}, slateData.entry_cost=${slateData?.entry_cost} (type=${typeof slateData?.entry_cost})`);

  if (entryCost && entryCost > 0) {
    const userSnap = await firestore.collection(Collections.USERS).doc(userId).get();
    const userCoins = (userSnap.data()?.coins as number) ?? 0;
    console.log(`${tag} balance check: userCoins=${userCoins}, entryCost=${entryCost}, sufficient=${userCoins >= entryCost}`);
    if (userCoins < entryCost) {
      console.log(`${tag} NOOP: insufficient coins (${userCoins} < ${entryCost})`);
      return { noop: "Insufficient coins" };
    }
  } else {
    console.log(`${tag} skipping balance check — entryCost is falsy or zero (entryCost=${entryCost})`);
  }

  const lobbyDocId = slateId || "WAITING";
  const lobbyWaitingRef = firestore
    .collection(Collections.PUBLIC_LOBBY)
    .doc(lobbyDocId);

  const contestId = uuidv4();
  console.log(`${tag} generated contestId=${contestId}, lobbyDocId=${lobbyDocId}`);

  const userPutInLobby = await firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(lobbyWaitingRef);
    console.log(`${tag} lobby doc exists=${doc.exists}, data=${JSON.stringify(doc.data())}`);
    if (!doc.exists) {
      console.log(`${tag} lobby empty — placing user in lobby`);
      transaction.set(lobbyWaitingRef, {
        user_id: userId,
        slate_id: slateId || null,
        contest_id: contestId,
      });
      return "new";
    }
    if (doc.data()?.user_id === userId) {
      console.log(`${tag} user already in lobby with contest_id=${doc.data()?.contest_id}`);
      return { already_waiting: true, contest_id: doc.data()?.contest_id };
    }
    console.log(`${tag} lobby occupied by ${doc.data()?.user_id} — matching and deleting lobby`);
    transaction.delete(lobbyWaitingRef);
    return doc.data();
  });

  console.log(`${tag} lobby transaction result: ${JSON.stringify(userPutInLobby)}`);

  if (
    typeof userPutInLobby === "object" &&
    userPutInLobby !== null &&
    "already_waiting" in userPutInLobby
  ) {
    const existingId = (userPutInLobby as Record<string, unknown>).contest_id as string;
    console.log(`${tag} returning early — already waiting, contest_id=${existingId}`);
    return { added: true, contest_id: existingId };
  }

  if (userPutInLobby === "new") {
    console.log(`${tag} PATH=new — user placed in lobby`);

    if (entryCost && entryCost > 0) {
      console.log(`${tag} deducting coins: amount=${entryCost}, contest_id=${slateId}`);
      try {
        await deductCoins(userId, entryCost, {
          type: "entry_fee",
          contest_id: slateId,
        });
        console.log(`${tag} deductCoins completed successfully`);
      } catch (err) {
        console.error(`${tag} deductCoins FAILED:`, err);
        throw err;
      }
    } else {
      console.log(`${tag} skipping deductCoins — entryCost falsy or zero (entryCost=${entryCost})`);
    }

    await Promise.all([
      firestore.collection(Collections.USER_CONTESTS).doc(userId).set({
        contests: {
          [contestId]: {
            stage: "pending",
            slate_id: slateId || null,
            slate: slateData || null,
            slate_name: slateData?.name || "",
          },
        },
      }, { merge: true }),
      firestore.collection(Collections.USER_IN_CONTEST).doc("state").set(
        { [userId]: true },
        { merge: true }
      ),
    ]);
    console.log(`${tag} user_contests and user_in_contest written, returning added=true`);
    return { added: true, contest_id: contestId };
  }

  const lobbyData = userPutInLobby as Record<string, unknown>;
  const existingContestId = lobbyData.contest_id as string | undefined;
  const opponentId = lobbyData.user_id as string;
  console.log(`${tag} PATH=matched — creating game with opponent=${opponentId}, existingContestId=${existingContestId}`);
  console.log(`${tag} coin deduction will be handled by joinContest (preDeducted=[${opponentId}])`);

  try {
    const cId = await joinContest(
      userId,
      opponentId,
      undefined,
      slateId,
      existingContestId,
      [opponentId]
    );
    console.log(`${tag} game created, contest_id=${cId}`);
    return { game_created: true, contest_id: cId };
  } catch (e) {
    console.error(`${tag} Failed to create contest:`, e);
    return { error: "could not create contest" };
  }
}
