import { onRequest } from "firebase-functions/v2/https";
import { pick } from "../lib/pick.js";
import { checkUserId } from "../../utils/checkUserId.js";
import { returnJson } from "../../utils/returnJson.js";

export const makePickFn = onRequest(async (req, res) => {
  const userId = req.query.userId as string;
  const pickId = req.query.pick as string;
  const token = req.query.token as string;
  const contestId = req.query.contestId as string | undefined;

  try {
    const user = await checkUserId(userId);
    if (!user) {
      returnJson(res, { noop: "User does not exist", userId });
      return;
    }
  } catch (e) {
    console.error(e);
    returnJson(res, { noop: "Error Getting User", userId });
    return;
  }

  const result = await pick(userId, pickId, token, contestId);
  returnJson(res, result);
});
