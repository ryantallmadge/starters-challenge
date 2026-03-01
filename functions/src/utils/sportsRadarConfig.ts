import { firestore, Collections } from "../admin.js";
import type { SportRadarConfig } from "../types.js";

export async function getSportsRadarConfig(): Promise<SportRadarConfig> {
  const snap = await firestore
    .collection(Collections.CONFIG)
    .doc("sports_radar")
    .get();
  return (snap.data() ?? {}) as SportRadarConfig;
}
