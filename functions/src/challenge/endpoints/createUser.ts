import { v4 as uuidv4 } from "uuid";
import { onRequest } from "firebase-functions/v2/https";
import { firestore, Collections } from "../../admin.js";
import { returnJson } from "../../utils/returnJson.js";
import type { CoinLedgerEntry } from "../../types.js";

const SIGNUP_BONUS = 100;

export const createUserUrlFn = onRequest(async (req, res) => {
  const displayName = req.query.display_name as string;
  const email = req.query.email as string;
  const id = req.query.id as string;

  if (!id || !displayName || !email) {
    returnJson(res, { error: "Missing required fields" }, 400);
    return;
  }

  const userRef = firestore.collection(Collections.USERS).doc(id);
  const snap = await userRef.get();

  if (!snap.exists) {
    await userRef.set({
      id,
      display_name: displayName,
      email,
      avatar: "Coach",
      avatar_picked: false,
      coins: SIGNUP_BONUS,
      created_at: Date.now(),
    });

    const entryId = uuidv4();
    const ledgerEntry: CoinLedgerEntry = {
      id: entryId,
      type: "signup_bonus",
      amount: SIGNUP_BONUS,
      balance_after: SIGNUP_BONUS,
      created_at: new Date().toISOString(),
    };

    await userRef
      .collection(Collections.COIN_LEDGER)
      .doc(entryId)
      .set(ledgerEntry);
  }

  returnJson(res, { success: true });
});
