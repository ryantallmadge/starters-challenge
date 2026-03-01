/**
 * Standalone script to backup users missing from Auth into BACKUP_USERS collection.
 * Run: npx ts-node --esm src/scripts/backupUsers.ts
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path.
 */
import { firestore, auth } from "../admin.js";
import { Batch } from "../utils/Batch.js";

async function backupUsers(): Promise<void> {
  const batch = new Batch(firestore);
  const userRefs = await firestore.collection("USERS").get();

  for (const userRef of userRefs.docs) {
    const user = userRef.data();

    try {
      await auth.getUser(user.id);
      console.log("Has user", user.id, user.email);
    } catch {
      const userRecordsRefs = await firestore
        .collection("USERS")
        .doc(user.id)
        .collection("RECORDS")
        .get();
      const userArchiveRefs = await firestore
        .collection("USERS")
        .doc(user.id)
        .collection("CONTEST_ARCHIVES")
        .get();

      batch.set(firestore.collection("BACKUP_USERS").doc(user.id), {
        ...user,
      });

      for (const recordRef of userRecordsRefs.docs) {
        const record = recordRef.data();
        batch.set(
          firestore
            .collection("BACKUP_USERS")
            .doc(user.id)
            .collection("RECORDS")
            .doc(recordRef.id),
          { ...record }
        );
        batch.delete(
          firestore
            .collection("USERS")
            .doc(user.id)
            .collection("RECORDS")
            .doc(recordRef.id)
        );
      }

      for (const recordRef of userArchiveRefs.docs) {
        const record = recordRef.data();
        batch.set(
          firestore
            .collection("BACKUP_USERS")
            .doc(user.id)
            .collection("CONTEST_ARCHIVES")
            .doc(recordRef.id),
          { ...record }
        );
        batch.delete(
          firestore
            .collection("USERS")
            .doc(user.id)
            .collection("CONTEST_ARCHIVES")
            .doc(recordRef.id)
        );
      }

      batch.delete(firestore.collection("USERS").doc(user.id));
      console.log("No Auth user", user.id, user.email);
    }
  }

  await batch.write();
}

backupUsers().then(() => {
  console.log("Backup complete");
  process.exit(0);
}).catch((e) => {
  console.error("Error backing up users:", e);
  process.exit(1);
});
