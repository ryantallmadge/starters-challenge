import { onRequest } from "firebase-functions/v2/https";
import { joinPublicContestLogic } from "../lib/joinPublicContest.js";
import { returnJson } from "../../utils/returnJson.js";

export const joinPublicContestFn = onRequest(async (req, res) => {
  console.log(`[joinPublicContestFn] called with userId=${req.query.userId}, slateId=${req.query.slateId}`);
  const userId = req.query.userId as string;
  const slateId = req.query.slateId as string | undefined;
  const result = await joinPublicContestLogic(userId, slateId);
  returnJson(res, result);
});
