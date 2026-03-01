import { onRequest } from "firebase-functions/v2/https";
import { runStandings } from "../lib/runStandings.js";
import { returnJson } from "../../utils/returnJson.js";

export const runStandingsFn = onRequest(async (req, res) => {
  await runStandings();
  returnJson(res, { standings_run: true });
});
