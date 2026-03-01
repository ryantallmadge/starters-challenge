/**
 * Standalone script to manually score the live slate.
 * Run: npx ts-node --esm src/scripts/scoreSlate.ts
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path.
 */
import "../admin.js";
import { scoreSlate } from "../challenge/lib/scoreSlate.js";

scoreSlate().then((result) => {
  console.log("Score slate result:", result);
  process.exit(0);
}).catch((e) => {
  console.error("Error scoring slate:", e);
  process.exit(1);
});
