import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, Collections } from "../../admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { joinContest } from "./joinContest.js";

export async function updateChallenge(
  userId: string,
  opponentId: string,
  action: string
): Promise<{
  noop?: string;
  invite_rejected?: boolean;
  invite_accepted?: boolean;
}> {
  if (userId === opponentId) {
    return { noop: "Can not update yourself" };
  }

  const checkUser = await checkUserId(userId);
  const checkOpponent = await checkUserId(opponentId);
  if (!checkUser || !checkOpponent) {
    return { noop: "User does not exist" };
  }

  if (action === "reject") {
    await Promise.all([
      firestore.collection(Collections.USERS).doc(opponentId).update({
        [`outgoing_invites.${userId}`]: FieldValue.delete(),
      }),
      firestore.collection(Collections.USERS).doc(userId).update({
        [`incoming_invites.${opponentId}`]: FieldValue.delete(),
      }),
    ]);
    return { invite_rejected: true };
  }

  if (action === "accept") {
    const userSnap = await firestore
      .collection(Collections.USERS)
      .doc(userId)
      .get();
    const userData = userSnap.data();
    const incomingInvites = userData?.incoming_invites ?? {};
    const invite = incomingInvites[opponentId] ?? {};

    await joinContest(
      userId,
      opponentId,
      invite.wager ?? "",
      invite.slate_id
    );

    await Promise.all([
      firestore.collection(Collections.USERS).doc(opponentId).update({
        outgoing_invites: FieldValue.delete(),
        incoming_invites: FieldValue.delete(),
      }),
      firestore.collection(Collections.USERS).doc(userId).update({
        outgoing_invites: FieldValue.delete(),
        incoming_invites: FieldValue.delete(),
      }),
    ]);
  }

  return { invite_accepted: true };
}
