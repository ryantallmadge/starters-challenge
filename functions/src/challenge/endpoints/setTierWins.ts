import { onRequest } from "firebase-functions/v2/https";
import { currentTierWins } from "../lib/currentTierWins.js";
import { returnJson } from "../../utils/returnJson.js";

export const setTierWinsFn = onRequest(async (req, res) => {
  await currentTierWins();
  returnJson(res, { tier_wins_set: true });
});
