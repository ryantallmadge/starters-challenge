import { MINUTES_DRAFT_CLOCK } from "./config.js";
import { checkUserId } from "../../utils/checkUserId.js";
import { firestore, messaging, Collections } from "../../admin.js";
import { FieldValue } from "firebase-admin/firestore";
import { enqueueDraftAutoPick } from "./enqueueDraftAutoPick.js";

export async function pick(
  userId: string,
  pickId: string,
  token: string,
  contestId?: string
): Promise<{ noop?: string; pick_made?: boolean }> {
  const userContestSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .doc(userId)
    .get();

  const userContestData = userContestSnap.data();

  let userContest: Record<string, unknown> | undefined;
  let resolvedContestId: string | undefined;

  if (contestId && userContestData?.contests?.[contestId]) {
    userContest = userContestData.contests[contestId];
    resolvedContestId = contestId;
  } else if (userContestData?.contests) {
    for (const [cId, contest] of Object.entries(userContestData.contests) as [string, any][]) {
      if (contest.draft?.token === token) {
        userContest = contest;
        resolvedContestId = cId;
        break;
      }
    }
  }

  if (!userContest || !resolvedContestId) {
    return { noop: "No active contest" };
  }

  const draft = userContest.draft as Record<string, unknown>;

  if (draft.token !== token) {
    console.error("Invalid draft token", userId, token);
    return { noop: "Invalid draft token" };
  }

  let currentRound: number = draft.round as number;
  const lastPickTime = new Date(draft.last_pick_time as string).getTime();
  const currentTime = new Date().getTime();
  const tieBreakTime = currentTime - lastPickTime;

  const slate = userContest.slate as Record<string, unknown>;
  const players = slate.players as Record<string, Record<string, unknown>>;

  if (!players[pickId] || players[pickId].picked) {
    console.error("Player Not In Slate", pickId);
    return { noop: "Player Not In Slate" };
  }

  const tiers = slate.tiers as Array<{ players: string[] }>;
  const currentTierPlayers = tiers[currentRound - 1].players;

  if (currentTierPlayers.indexOf(pickId) === -1) {
    console.error("Player Not In Current Tier", pickId);
    return { noop: "Player Not In Current Tier" };
  }

  if (draft.on_the_clock !== userId) {
    console.error("You are not on the clock");
    return { noop: "You are not on the clock" };
  }

  const picks = userContest.picks as Record<string, string> | undefined;
  if (picks && picks[currentRound]) {
    console.error("Pick for round already made");
    return { noop: "Pick for round already made" };
  }

  const oppenent = userContest.oppenent as Record<string, unknown>;
  const opponentId = oppenent.id as string;
  const prefix = `contests.${resolvedContestId}`;

  await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).doc(userId).update({
      [`${prefix}.picks.${currentRound - 1}`]: pickId,
      [`${prefix}.slate.players.${pickId}.picked`]: 1,
      [`${prefix}.slate.players.${pickId}.tie_breaker`]: tieBreakTime,
    }),
    firestore.collection(Collections.USER_CONTESTS).doc(opponentId).update({
      [`${prefix}.oppenent.picks.${currentRound - 1}`]: pickId,
      [`${prefix}.slate.players.${pickId}.picked`]: 1,
    }),
  ]);

  const currentPick: number = (draft.current_pick as number) + 1;

  if (currentPick > 0 && currentPick % 2 === 0) {
    currentRound = currentRound + 1;
  }

  const order = draft.order as string[];
  if (!order[currentPick]) {
    await Promise.all([
      firestore.collection(Collections.USER_CONTESTS).doc(opponentId).update({
        [`${prefix}.stage`]: "live",
      }),
      firestore.collection(Collections.USER_CONTESTS).doc(userId).update({
        [`${prefix}.stage`]: "live",
      }),
      firestore.collection(Collections.ACTIVE_DRAFTS).doc(resolvedContestId).delete(),
    ]);
    return { noop: "Draft has ended" };
  }

  const onTheClock: string = order[currentPick];
  const date = new Date();
  const now = date.toISOString();
  date.setMinutes(date.getMinutes() + MINUTES_DRAFT_CLOCK);
  const pickTime = date.toISOString();

  const draftUpdate = {
    [`${prefix}.draft.round`]: currentRound,
    [`${prefix}.draft.on_the_clock`]: onTheClock,
    [`${prefix}.draft.current_pick`]: currentPick,
    [`${prefix}.draft.last_pick_time`]: now,
    [`${prefix}.draft.next_pick_time`]: pickTime,
  };

  await Promise.all([
    firestore.collection(Collections.USER_CONTESTS).doc(opponentId).update(draftUpdate),
    firestore.collection(Collections.USER_CONTESTS).doc(userId).update(draftUpdate),
  ]);

  try {
    await enqueueDraftAutoPick(resolvedContestId, onTheClock, currentPick, pickTime);
  } catch (e) {
    console.error("Failed to enqueue auto-pick task:", e);
  }

  if (onTheClock !== userId) {
    const opponent = await checkUserId(opponentId);

    if (opponent && opponent.message_token) {
      try {
        await messaging.send({
          token: opponent.message_token,
          notification: {
            title: "It's Your Pick",
            body: `You are on the clock! Round ${currentRound} Pick ${currentPick}`,
          },
        });
      } catch (e) {
        console.error("Failed to send pick notification:", e);
      }
    }
  }

  return { pick_made: true };
}
