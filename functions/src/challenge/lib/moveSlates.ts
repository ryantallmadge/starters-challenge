import { FieldValue } from "firebase-admin/firestore";
import { firestore, Collections } from "../../admin.js";

export async function moveSlates(): Promise<void> {
  const currentSlateSnap = await firestore
    .collection(Collections.SLATES)
    .doc("current")
    .get();
  const currentSlateVal = currentSlateSnap.data();
  if (!currentSlateVal) return;

  const now = new Date();
  const currentStart = new Date(currentSlateVal.start);

  if (currentStart <= now) {
    const [upcomingSlateSnap, userContestsSnap] = await Promise.all([
      firestore.collection(Collections.SLATES).doc("upcoming").get(),
      firestore.collection(Collections.USER_CONTESTS).get(),
    ]);

    const upcomingSlateVal = upcomingSlateSnap.data();
    if (!upcomingSlateVal || userContestsSnap.empty) return;

    const removeContests: Array<Promise<FirebaseFirestore.WriteResult>> = [];
    const staleLobbyIds = new Set<string>();

    for (const doc of userContestsSnap.docs) {
      const data = doc.data();
      const contests = data.contests as Record<string, Record<string, unknown>> | undefined;
      if (!contests) continue;

      for (const [contestId, contest] of Object.entries(contests)) {
        if (contest.stage === "draft" || contest.stage === "pending") {
          console.log(`Removing ${contest.stage} contest ${contestId} for ${doc.id}`);
          removeContests.push(
            firestore.collection(Collections.USER_CONTESTS).doc(doc.id).update({
              [`contests.${contestId}`]: FieldValue.delete(),
            })
          );
          if (contest.stage === "pending") {
            const slateId = (contest.slate_id as string) || (contest.slate as Record<string, unknown>)?.id as string | undefined;
            staleLobbyIds.add(slateId || "WAITING");
          }
        }
      }
    }

    const lobbyCleanups = Array.from(staleLobbyIds).map((lobbyDocId) => {
      console.log(`Cleaning up stale lobby entry: ${lobbyDocId}`);
      return firestore.collection(Collections.PUBLIC_LOBBY).doc(lobbyDocId).delete();
    });

    console.log(`Moving ${upcomingSlateVal.id} to current`);
    await Promise.all([
      ...removeContests,
      ...lobbyCleanups,
      firestore
        .collection(Collections.SLATES)
        .doc("current")
        .set({ ...upcomingSlateVal }),
    ]);
  }
}
