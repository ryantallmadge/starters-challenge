import { onRequest } from "firebase-functions/v2/https";
import { updateLeaderboard } from "../lib/updateLeaderboard.js";
import { returnJson } from "../../utils/returnJson.js";

export const updateLeaderboardFn = onRequest(async (req, res) => {
  const result = await updateLeaderboard();
  returnJson(res, result);
});
