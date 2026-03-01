import { onRequest } from "firebase-functions/v2/https";
import { searchUsers } from "../lib/searchUsers.js";
import { returnJson } from "../../utils/returnJson.js";

export const searchUsersFn = onRequest(async (req, res) => {
  const displayName = req.query.display_name as string;
  const result = await searchUsers(displayName);
  returnJson(res, result);
});
