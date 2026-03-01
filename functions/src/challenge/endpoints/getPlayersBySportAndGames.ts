import { onRequest } from "firebase-functions/v2/https";
import { getPlayersBySportAndGames } from "../lib/getPlayersBySportAndGames.js";
import { returnJson } from "../../utils/returnJson.js";

export const getPlayersBySportAndGamesFn = onRequest(async (req, res) => {
  const sport = req.query.sport as string;
  const gameIds = (req.query.gameIds as string).split(",");
  if (!sport || !gameIds) return;
  const players = await getPlayersBySportAndGames(sport, gameIds);
  returnJson(res, players);
});
