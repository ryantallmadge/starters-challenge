// @ts-expect-error no type declarations for bad-words
import Filter from "bad-words";
import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, messaging, Collections } from "../../admin.js";
import type { ChatMessage } from "../../types.js";

const badwords = new Filter();

const CURRENT_AVATARS: Record<string, string> = {
  linesman: "Linesman",
  referee: "Referee",
  trainer: "Trainer",
  streaker: "Streaker",
  fan_guy: "Fanguy",
  dragon: "Dragon",
};

function getAvatarUrl(avatar: string): string {
  const mapped = CURRENT_AVATARS[avatar] ? CURRENT_AVATARS[avatar] : avatar;
  return `https://s3.us-east-2.amazonaws.com/fanium-app-assets/avatars/${mapped}.png`;
}

export async function addChat(
  userId: string,
  message: string,
  contestId?: string
): Promise<{ noop?: string; message_added?: boolean }> {
  const user = await checkUserId(userId);
  if (!user) {
    return { noop: "User does not exist" };
  }

  const cleanMessage = badwords.clean(message);

  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(userId)
    .get();

  const contestData = userContestSnap.data();

  let contestVal: Record<string, unknown> | undefined;
  let resolvedContestId: string | undefined;

  if (contestId && contestData?.contests?.[contestId]) {
    contestVal = contestData.contests[contestId];
    resolvedContestId = contestId;
  } else if (contestData?.contests) {
    const entries = Object.entries(contestData.contests) as [string, any][];
    const active = entries.find(([, c]) => c.stage === "draft" || c.stage === "live");
    if (active) {
      [resolvedContestId, contestVal] = active;
    }
  }

  if (!contestVal || !resolvedContestId) return { noop: "No active contest" };

  if (!contestVal.chats) contestVal.chats = [];
  const chats = contestVal.chats as ChatMessage[];

  const newChat: ChatMessage = {
    _id: chats.length + 1,
    text: cleanMessage,
    createdAt: new Date().toISOString(),
    user: {
      _id: userId,
      name: user.display_name || "",
      avatar: getAvatarUrl(user.avatar || "fan_guy"),
    },
  };

  chats.unshift(newChat);
  const oppenent = contestVal.oppenent as Record<string, unknown>;
  const prefix = `contests.${resolvedContestId}`;

  await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).doc(userId).update({
      [`${prefix}.chats`]: chats,
    }),
    firestore.collection(Collections.USER_CONTESTS).doc(oppenent.id as string).update({
      [`${prefix}.chats`]: chats,
    }),
  ]);

  const opponentUser = await checkUserId(oppenent.id as string);

  if (opponentUser && opponentUser.message_token) {
    try {
      await messaging.send({
        token: opponentUser.message_token!,
        notification: {
          title: `${user.display_name} sent you a chat message!`,
          body: cleanMessage,
        },
      });
    } catch (e) {
      console.error("Failed to send chat notification:", e);
    }
  }

  return { message_added: true };
}
