/**
 * CLI script — fetch tomorrow's NBA + NHL games from API-Sports and build
 * all slates (paid + free) in AVAILABLE_SLATES + SLATES/current.
 *
 * Run against the emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=starters-challenge \
 *     npx tsx src/scripts/createNbaSlatesFromApi.ts
 *
 * Run against prod (careful!):
 *   npx tsx src/scripts/createNbaSlatesFromApi.ts
 */
import { createAllSlatesForDate } from "../challenge/lib/createSlatesFromApi.js";

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  await createAllSlatesForDate(dateStr);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
