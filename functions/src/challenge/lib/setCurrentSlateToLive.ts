import { firestore, Collections } from "../../admin.js";

export async function setCurrentSlateToLive(): Promise<{ slate_moved: boolean }> {
  const currentSlateSnap = await firestore
    .collection(Collections.SLATES)
    .doc("current")
    .get();
  const slate = currentSlateSnap.data();

  if (slate) {
    await firestore
      .collection(Collections.SLATES)
      .doc("live")
      .set({ ...slate });
  }

  return { slate_moved: true };
}
