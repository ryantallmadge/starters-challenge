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

    const removeDrafts: Array<Promise<FirebaseFirestore.WriteResult>> = [];

    for (const doc of userContestsSnap.docs) {
      const data = doc.data();
      const contests = data.contests as Record<string, Record<string, unknown>> | undefined;
      if (!contests) continue;

      for (const [contestId, contest] of Object.entries(contests)) {
        if (contest.stage === "draft") {
          console.log(`Removing draft ${contestId} for ${doc.id}`);
          removeDrafts.push(
            firestore.collection(Collections.USER_CONTESTS).doc(doc.id).update({
              [`contests.${contestId}`]: FieldValue.delete(),
            })
          );
        }
      }
    }

    console.log(`Moving ${upcomingSlateVal.id} to current`);
    await Promise.all([
      ...removeDrafts,
      firestore
        .collection(Collections.SLATES)
        .doc("current")
        .set({ ...upcomingSlateVal }),
    ]);
  }
}
