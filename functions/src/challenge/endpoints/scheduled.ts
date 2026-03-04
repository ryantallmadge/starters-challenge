import { onSchedule } from "firebase-functions/v2/scheduler";
import { scoreSlate } from "../lib/scoreSlate.js";
import { moveSlates } from "../lib/moveSlates.js";
import { runStandings } from "../lib/runStandings.js";
import { updateLeaderboard } from "../lib/updateLeaderboard.js";
import { currentTierWins } from "../lib/currentTierWins.js";
import { fillStalePendingDrafts } from "../lib/fillStalePendingDrafts.js";
import { createNextDaySlates, createDailyFreeSlates } from "../lib/createSlatesFromApi.js";

export const runScoreLiveSlate = onSchedule(
  {
    schedule: "*/5 * * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async () => {
    await scoreSlate();
  }
);

export const runMoveSlates = onSchedule(
  {
    schedule: "*/5 * * * *",
    timeZone: "America/New_York",
  },
  async () => {
    await moveSlates();
  }
);

export const runStandingsScheduled = onSchedule(
  {
    schedule: "0 10 * * *",
    timeZone: "America/New_York",
  },
  async () => {
    await runStandings();
  }
);

export const updateLeaderboardScheduled = onSchedule(
  {
    schedule: "0 11 * * *",
    timeZone: "America/New_York",
  },
  async () => {
    await updateLeaderboard();
  }
);

export const setTierWinsScheduled = onSchedule(
  {
    schedule: "*/5 * * * *",
    timeZone: "America/New_York",
  },
  async () => {
    await currentTierWins();
  }
);

export const fillStalePendingDraftsScheduled = onSchedule(
  {
    schedule: "*/1 * * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 120,
  },
  async () => {
    await fillStalePendingDrafts();
  }
);

export const createNextDaySlatesScheduled = onSchedule(
  {
    schedule: "0 20 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    await createNextDaySlates();
  }
);

export const createDailyFreeChallengeScheduled = onSchedule(
  {
    schedule: "0 4 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    await createDailyFreeSlates();
  }
);

