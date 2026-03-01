import { onRequest } from "firebase-functions/v2/https";
import { firestore, Collections } from "../../admin.js";
import { returnJson } from "../../utils/returnJson.js";

export const getUpcomingSlateFn = onRequest(async (req, res) => {
  const snap = await firestore
    .collection(Collections.SLATES)
    .doc("upcoming")
    .get();
  returnJson(res, snap.data() ?? null);
});
