import { onRequest } from "firebase-functions/v2/https";
import { addChat } from "../lib/addChat.js";
import { returnJson } from "../../utils/returnJson.js";

export const addChatFn = onRequest(async (req, res) => {
  const userId = req.query.userId as string;
  const message = req.query.message as string;
  const contestId = req.query.contestId as string | undefined;
  const result = await addChat(userId, message, contestId);
  returnJson(res, result);
});
