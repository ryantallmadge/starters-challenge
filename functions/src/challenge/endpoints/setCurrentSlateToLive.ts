import { onRequest } from "firebase-functions/v2/https";
import { setCurrentSlateToLive } from "../lib/setCurrentSlateToLive.js";
import { returnJson } from "../../utils/returnJson.js";

export const setCurrentSlateToLiveFn = onRequest(async (req, res) => {
  const result = await setCurrentSlateToLive();
  returnJson(res, result);
});
