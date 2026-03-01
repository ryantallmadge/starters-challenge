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
  const tag = `[deductCoins][user=${userId}]`;
  console.log(`${tag} called: amount=${amount}, meta=${JSON.stringify(meta)}`);

  await firestore.runTransaction(async (transaction) => {
    const userRef = firestore.collection(Collections.USERS).doc(userId);
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data();

    console.log(`${tag} userSnap.exists=${userSnap.exists}, userData.coins=${userData?.coins} (type=${typeof userData?.coins})`);

    if (!userData) {
      console.error(`${tag} ABORT: user doc not found`);
      throw new Error("User not found");
    }

    const currentCoins = userData.coins ?? 0;
    if (currentCoins < amount) {
      console.error(`${tag} ABORT: insufficient coins (${currentCoins} < ${amount})`);
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

    console.log(`${tag} writing: coins ${currentCoins} -> ${newBalance}, ledger entry=${entryId}, ledgerPath=${ledgerRef.path}`);
    console.log(`${tag} ledger entry: ${JSON.stringify(entry)}`);

    transaction.update(userRef, { coins: newBalance });
    transaction.set(ledgerRef, entry);
    console.log(`${tag} transaction ops queued (update user + set ledger)`);
  });

  console.log(`${tag} transaction committed successfully`);
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
