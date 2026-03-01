import { onRequest } from "firebase-functions/v2/https";
import { inviteChallenge } from "../lib/inviteChallenge.js";
import { returnJson } from "../../utils/returnJson.js";

export const inviteChallengeFn = onRequest(async (req, res) => {
  const userId = req.query.userId as string;
  const opponentId = req.query.oppenentId as string;
  const wager = req.query.wager as string;
  const slateId = req.query.slateId as string | undefined;
  const slateName = req.query.slateName as string | undefined;
  const result = await inviteChallenge(userId, opponentId, wager, slateId, slateName);
  returnJson(res, result);
});
