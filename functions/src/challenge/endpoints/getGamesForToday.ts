import { onRequest } from "firebase-functions/v2/https";
import { getDailyGames } from "../lib/getDailyGames.js";
import { returnJson } from "../../utils/returnJson.js";

export const getGamesForTodayFn = onRequest(async (req, res) => {
  const games = await getDailyGames();
  returnJson(res, games);
});
