import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { firestore, Collections } from "../../admin.js";
import { pick } from "../lib/pick.js";
import { getBestPick } from "../lib/getBestPick.js";
import type { SlatePlayer } from "../../types.js";
import type { AutoPickPayload } from "../lib/enqueueDraftAutoPick.js";

export const autoPickTaskFn = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 10,
    },
    rateLimits: {
      maxConcurrentDispatches: 20,
    },
  },
  async (req) => {
    const { contestId, userId, expectedPick } = req.data as AutoPickPayload;

    console.log(
      `Auto-pick task fired for user ${userId}, contest ${contestId}, expectedPick ${expectedPick}`
    );

    const activeDraftSnap = await firestore
      .collection(Collections.ACTIVE_DRAFTS)
      .doc(contestId)
      .get();

    if (!activeDraftSnap.exists) {
      console.log(`Draft ${contestId} no longer active, skipping`);
      return;
    }

    const userContestSnap = await firestore
      .collection(Collections.USER_CONTESTS)
      .doc(userId)
      .get();

    const userData = userContestSnap.data();
    const contest = userData?.contests?.[contestId] as Record<string, unknown> | undefined;

    if (!contest) {
      console.log(`Contest ${contestId} not found for user ${userId}, skipping`);
      return;
    }

    if (contest.stage !== "draft") {
      console.log(`Contest ${contestId} is no longer in draft stage, skipping`);
      return;
    }

    const draft = contest.draft as Record<string, unknown>;
    if (!draft) {
      console.log(`No draft state for contest ${contestId}, skipping`);
      return;
    }

    if ((draft.current_pick as number) !== expectedPick) {
      console.log(
        `Pick already advanced (current: ${draft.current_pick}, expected: ${expectedPick}), skipping`
      );
      return;
    }

    if ((draft.on_the_clock as string) !== userId) {
      console.log(`User ${userId} is not on the clock, skipping`);
      return;
    }

    const slate = contest.slate as Record<string, unknown>;
    const tiers = slate.tiers as Array<{ players: string[] }>;
    const players = slate.players as Record<string, SlatePlayer>;
    const round = draft.round as number;

    const bestPick = getBestPick(tiers[round - 1], players, contest);

    if (!bestPick) {
      console.error(`No available player to auto-pick in contest ${contestId}`);
      return;
    }

    const token = draft.token as string;

    console.log(`Auto-picking ${bestPick.id} for ${userId} in contest ${contestId}`);
    const result = await pick(userId, bestPick.id, token, contestId);
    console.log(`Auto-pick result:`, JSON.stringify(result));
  }
);
