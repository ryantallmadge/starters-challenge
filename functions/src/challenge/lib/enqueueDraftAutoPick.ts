import { getFunctions } from "firebase-admin/functions";

export interface AutoPickPayload {
  contestId: string;
  userId: string;
  expectedPick: number;
}

export async function enqueueDraftAutoPick(
  contestId: string,
  userId: string,
  expectedPick: number,
  nextPickTime: string
): Promise<void> {
  const delayMs = new Date(nextPickTime).getTime() - Date.now();
  const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000));

  const queue = getFunctions().taskQueue("autoPickTask");
  await queue.enqueue(
    { contestId, userId, expectedPick } satisfies AutoPickPayload,
    { scheduleDelaySeconds: delaySeconds }
  );

  console.log(
    `Enqueued auto-pick task for user ${userId} in contest ${contestId} ` +
    `(pick ${expectedPick}) in ${delaySeconds}s`
  );
}
