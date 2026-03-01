import { onRequest } from "firebase-functions/v2/https";
import { updateChallenge } from "../lib/updateChallenge.js";
import { returnJson } from "../../utils/returnJson.js";

export const updateChallengeFn = onRequest(async (req, res) => {
  const userId = req.query.userId as string;
  const opponentId = req.query.oppenentId as string;
  const action = req.query.action as string;
  const result = await updateChallenge(userId, opponentId, action);
  returnJson(res, result);
});
