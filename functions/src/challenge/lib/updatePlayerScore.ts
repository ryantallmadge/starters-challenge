import { firestore, Collections } from "../../admin.js";

export async function updatePlayerScores(
  slateData: Record<string, unknown>
): Promise<void> {
  const userContestsSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .get();
  if (userContestsSnap.empty) return;

  const updates: Array<Promise<FirebaseFirestore.WriteResult>> = [];

  for (const doc of userContestsSnap.docs) {
    const data = doc.data();
    const contests = data.contests as Record<string, Record<string, unknown>> | undefined;
    if (!contests) continue;

    for (const [contestId, contest] of Object.entries(contests)) {
      const slate = contest.slate as Record<string, unknown> | undefined;
      if (slate && slate.id === slateData.id) {
        console.log("Updating Contest", doc.id, contestId);
        updates.push(
          firestore
            .collection(Collections.USER_CONTESTS)
            .doc(doc.id)
            .update({ [`contests.${contestId}.slate`]: slateData })
        );
      }
    }
  }

  await Promise.all(updates);
}
