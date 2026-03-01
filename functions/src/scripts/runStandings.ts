/**
 * Standalone script to manually run standings.
 * Run: npx ts-node --esm src/scripts/runStandings.ts
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path.
 */
import "../admin.js";
import { runStandings } from "../challenge/lib/runStandings.js";

runStandings().then(() => {
  console.log("Standings run complete");
  process.exit(0);
}).catch((e) => {
  console.error("Error running standings:", e);
  process.exit(1);
});
