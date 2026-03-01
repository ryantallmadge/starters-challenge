import { onRequest } from "firebase-functions/v2/https";
import { updatePlayerScores } from "../lib/updatePlayerScore.js";
import { returnJson } from "../../utils/returnJson.js";
import { firestore, Collections } from "../../admin.js";

export const updatePlayerScoresFn = onRequest(async (req, res) => {
  const liveSlateSnap = await firestore
    .collection(Collections.SLATES)
    .doc("live")
    .get();
  const liveSlate = liveSlateSnap.data();
  if (liveSlate) {
    await updatePlayerScores(liveSlate);
  }
  returnJson(res, { updated: true });
});
