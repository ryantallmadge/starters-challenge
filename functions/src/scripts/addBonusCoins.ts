/**
 * Add 100 bonus coins to a user.
 * Usage: npm run script:bonus-coins -- <userId>
 */
import { firestore, Collections } from "../admin.js";
import { creditCoins } from "../challenge/lib/coins.js";

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npm run script:bonus-coins -- <userId>");
  process.exit(1);
}

async function addBonusCoins(): Promise<void> {
  await creditCoins(userId, 100, { type: "bonus" });

  const userRef = firestore.collection(Collections.USERS).doc(userId);
  const snap = await userRef.get();
  const data = snap.data();
  console.log(`User: ${data?.display_name || userId}`);
  console.log(`New balance: ${data?.coins ?? 0}`);
  console.log("100 bonus coins added successfully.");
}

addBonusCoins()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error adding bonus coins:", e);
    process.exit(1);
  });
