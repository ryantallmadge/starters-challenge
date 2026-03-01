/**
 * Standalone script to test sending a push notification.
 * Run: npx ts-node --esm src/scripts/sendNotification.ts <token>
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path.
 */
import { messaging } from "../admin.js";

const token = process.argv[2];

if (!token) {
  console.error("Usage: npx ts-node --esm src/scripts/sendNotification.ts <device-token>");
  process.exit(1);
}

async function testNotification(): Promise<void> {
  try {
    const result = await messaging.send({
      token,
      notification: {
        title: "Test Notification",
        body: "Testing notifications from starters-challenge",
      },
    });
    console.log("Notification sent:", result);
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}

testNotification().then(() => process.exit(0));
