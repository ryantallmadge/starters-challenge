/**
 * Clear all active drafts, lobby, user contests, and related state from Firestore.
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/clearDrafts.ts
 */
import { firestore, Collections } from "../admin.js";
import { Batch } from "../utils/Batch.js";

async function clearDrafts(): Promise<void> {
  const batch = new Batch(firestore);

  const [draftsSnap, contestsSnap, lobbySnap] = await Promise.all([
    firestore.collection(Collections.ACTIVE_DRAFTS).get(),
    firestore.collection(Collections.USER_CONTESTS).get(),
    firestore.collection(Collections.PUBLIC_LOBBY).get(),
  ]);

  console.log(`Found ${draftsSnap.size} active draft(s).`);
  for (const doc of draftsSnap.docs) {
    batch.delete(doc.ref);
  }

  console.log(`Found ${contestsSnap.size} user contest(s).`);
  for (const doc of contestsSnap.docs) {
    batch.delete(doc.ref);
  }

  console.log(`Found ${lobbySnap.size} lobby doc(s).`);
  for (const doc of lobbySnap.docs) {
    batch.delete(doc.ref);
  }

  const inContestRef = firestore.collection(Collections.USER_IN_CONTEST).doc("state");
  const inContestSnap = await inContestRef.get();
  if (inContestSnap.exists) {
    batch.delete(inContestRef);
    console.log("Deleting USER_IN_CONTEST state.");
  }

  await batch.write();
  console.log("All drafts, lobby, and contests cleared.");
}

clearDrafts().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error clearing drafts:", e);
  process.exit(1);
});
