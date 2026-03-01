import { v4 as uuidv4 } from "uuid";
import { firestore, Collections } from "../../admin.js";
import type { CoinLedgerEntry } from "../../types.js";

interface CoinTransactionMeta {
  type: CoinLedgerEntry["type"];
  contest_id?: string;
  opponent_id?: string;
}

export async function deductCoins(
  userId: string,
  amount: number,
  meta: CoinTransactionMeta
): Promise<void> {
  await firestore.runTransaction(async (transaction) => {
    const userRef = firestore.collection(Collections.USERS).doc(userId);
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data();

    if (!userData) {
      throw new Error("User not found");
    }

    const currentCoins = userData.coins ?? 0;
    if (currentCoins < amount) {
      throw new Error("Insufficient coins");
    }

    const newBalance = currentCoins - amount;
    const entryId = uuidv4();
    const ledgerRef = userRef.collection(Collections.COIN_LEDGER).doc(entryId);

    const entry: Record<string, any> = {
      id: entryId,
      type: meta.type,
      amount: -amount,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    };
    if (meta.contest_id) entry.contest_id = meta.contest_id;
    if (meta.opponent_id) entry.opponent_id = meta.opponent_id;

    transaction.update(userRef, { coins: newBalance });
    transaction.set(ledgerRef, entry);
  });
}

export async function creditCoins(
  userId: string,
  amount: number,
  meta: CoinTransactionMeta
): Promise<void> {
  await firestore.runTransaction(async (transaction) => {
    const userRef = firestore.collection(Collections.USERS).doc(userId);
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data();

    if (!userData) {
      throw new Error("User not found");
    }

    const currentCoins = userData.coins ?? 0;
    const newBalance = currentCoins + amount;
    const entryId = uuidv4();
    const ledgerRef = userRef.collection(Collections.COIN_LEDGER).doc(entryId);

    const entry: Record<string, any> = {
      id: entryId,
      type: meta.type,
      amount,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    };
    if (meta.contest_id) entry.contest_id = meta.contest_id;
    if (meta.opponent_id) entry.opponent_id = meta.opponent_id;

    transaction.update(userRef, { coins: newBalance });
    transaction.set(ledgerRef, entry);
  });
}
