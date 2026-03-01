/**
 * Standalone script to manually update the leaderboard.
 * Run: npx ts-node --esm src/scripts/updateLeaderboard.ts
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path.
 */
import "../admin.js";
import { updateLeaderboard } from "../challenge/lib/updateLeaderboard.js";

updateLeaderboard().then((result) => {
  console.log("Leaderboard updated:", result.length, "entries");
  process.exit(0);
}).catch((e) => {
  console.error("Error updating leaderboard:", e);
  process.exit(1);
});
