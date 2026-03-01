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
  const checkUser = await checkUserId(userId);
  if (!checkUser) {
    return { noop: "User does not exist" };
  }

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(userId)
    .get();
  const userContestData = userContestSnap.data();

  if (userContestData?.contests && slateId) {
    for (const contest of Object.values(userContestData.contests) as any[]) {
      const contestSlateId = contest.slate?.id || contest.slate_id;
      if (contestSlateId === slateId && (contest.stage === "draft" || contest.stage === "pending")) {
        return { noop: "You already have an active contest for this slate" };
      }
    }
  }

  const slateRef = slateId
    ? firestore.collection(Collections.AVAILABLE_SLATES).doc(slateId)
    : firestore.collection(Collections.SLATES).doc("current");
  const slateSnap = await slateRef.get();
  const slateData = slateSnap.data();
  const entryCost = slateData?.entry_cost as number | undefined;

  if (entryCost && entryCost > 0) {
    const userSnap = await firestore.collection(Collections.USERS).doc(userId).get();
    const userCoins = (userSnap.data()?.coins as number) ?? 0;
    if (userCoins < entryCost) {
      return { noop: "Insufficient coins" };
    }
  }

  const lobbyDocId = slateId || "WAITING";
  const lobbyWaitingRef = firestore
    .collection(Collections.PUBLIC_LOBBY)
    .doc(lobbyDocId);

  const contestId = uuidv4();

  const userPutInLobby = await firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(lobbyWaitingRef);
    if (!doc.exists) {
      transaction.set(lobbyWaitingRef, {
        user_id: userId,
        slate_id: slateId || null,
        contest_id: contestId,
      });
      return "new";
    }
    if (doc.data()?.user_id === userId) {
      return { already_waiting: true, contest_id: doc.data()?.contest_id };
    }
    transaction.delete(lobbyWaitingRef);
    return doc.data();
  });

  if (
    typeof userPutInLobby === "object" &&
    userPutInLobby !== null &&
    "already_waiting" in userPutInLobby
  ) {
    const existingId = (userPutInLobby as Record<string, unknown>).contest_id as string;
    return { added: true, contest_id: existingId };
  }

  if (userPutInLobby === "new") {
    if (entryCost && entryCost > 0) {
      await deductCoins(userId, entryCost, {
        type: "entry_fee",
        contest_id: slateId,
      });
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
    return { added: true, contest_id: contestId };
  }

  const lobbyData = userPutInLobby as Record<string, unknown>;
  const existingContestId = lobbyData.contest_id as string | undefined;

  try {
    const opponentId = lobbyData.user_id as string;
    const cId = await joinContest(
      userId,
      opponentId,
      undefined,
      slateId,
      existingContestId,
      [opponentId]
    );
    return { game_created: true, contest_id: cId };
  } catch (e) {
    console.error("Failed to create contest:", e);
    return { error: "could not create contest" };
  }
}
