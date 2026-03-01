import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, messaging, Collections } from "../../admin.js";

export async function inviteChallenge(
  userId: string,
  opponentId: string,
  wager: string,
  slateId?: string,
  slateName?: string
): Promise<{ noop?: string; invite_created?: boolean }> {
  if (userId === opponentId) {
    return { noop: "Can not challenge yourself" };
  }

  const [checkUser, checkOpponent] = await Promise.all([
    checkUserId(userId),
    checkUserId(opponentId),
  ]);

  if (!checkUser || !checkOpponent) {
    return { noop: "User does not exist" };
  }

  const inviteBase = {
    wager,
    created_at: new Date().toISOString(),
    ...(slateId ? { slate_id: slateId } : {}),
    ...(slateName ? { slate_name: slateName } : {}),
  };

  await Promise.all([
    firestore.collection(Collections.USERS).doc(userId).update({
      [`outgoing_invites.${opponentId}`]: {
        ...inviteBase,
        display_name: checkOpponent.display_name,
        avatar: checkOpponent.avatar,
        id: opponentId,
      },
    }),
    firestore.collection(Collections.USERS).doc(opponentId).update({
      [`incoming_invites.${userId}`]: {
        ...inviteBase,
        display_name: checkUser.display_name,
        avatar: checkUser.avatar,
        id: userId,
      },
    }),
  ]);

  if (checkOpponent.message_token) {
    try {
      await messaging.send({
        token: checkOpponent.message_token,
        notification: {
          title: "You have been challenged!",
          body: `${checkUser.display_name} has challenged you for "${wager}"`,
        },
      });
    } catch (e) {
      console.error("Failed to send invite notification:", e);
    }
  }

  return { invite_created: true };
}
