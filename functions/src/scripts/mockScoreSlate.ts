/**
 * Generate mock player scores for ALL live contests without hitting SportRadar.
 *
 * Scans USER_CONTESTS to discover every unique slate referenced by live-stage
 * contests, generates random stats, scores them via scorePlayer(), and
 * propagates via updatePlayerScores() — the same path production uses.
 *
 * Run:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=starters-challenge \
 *     npx tsx src/scripts/mockScoreSlate.ts
 */
import "../admin.js";
import { firestore, Collections } from "../admin.js";
import { scorePlayer } from "../challenge/lib/scoreSlate.js";
import { updatePlayerScores } from "../challenge/lib/updatePlayerScore.js";
import type { SlatePlayer, SlateTier } from "../types.js";

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ---------------------------------------------------------------------------
// Sport-specific mock stat generators
// ---------------------------------------------------------------------------

function generateNBAStats(position: string): Record<string, unknown> {
  const isGuard = ["PG", "SG"].includes(position);
  const isCenter = position === "C";
  return {
    points: randInt(isGuard ? 12 : 6, isGuard ? 38 : 28),
    three_points_made: randInt(0, isGuard ? 8 : 3),
    rebounds: randInt(isCenter ? 5 : 1, isCenter ? 16 : 8),
    assists: randInt(isGuard ? 2 : 0, isGuard ? 14 : 6),
    steals: randInt(0, isGuard ? 4 : 2),
    blocks: randInt(0, isCenter ? 4 : 2),
    turnovers: randInt(0, 5),
  };
}

function generateNFLStats(position: string): Record<string, unknown> {
  if (position === "QB") {
    return {
      passing: {
        touchdowns: randInt(0, 4),
        yards: randInt(150, 420),
        interceptions: randInt(0, 2),
      },
      rushing: { touchdowns: randInt(0, 1), yards: randInt(0, 45) },
      fumbles: { fumbles: randInt(0, 1) },
    };
  }
  if (position === "RB") {
    return {
      rushing: { touchdowns: randInt(0, 3), yards: randInt(30, 160) },
      receiving: {
        touchdowns: randInt(0, 1),
        receptions: randInt(0, 6),
        yards: randInt(0, 60),
      },
      fumbles: { fumbles: randInt(0, 1) },
    };
  }
  if (["WR", "TE"].includes(position)) {
    return {
      receiving: {
        touchdowns: randInt(0, 2),
        receptions: randInt(2, 10),
        yards: randInt(20, 160),
      },
      rushing: { touchdowns: 0, yards: randInt(0, 15) },
      fumbles: { fumbles: randInt(0, 1) },
    };
  }
  return {
    defense: {
      tackles: randInt(2, 10),
      assists: randInt(0, 5),
      tloss: randInt(0, 3),
      sacks: randFloat(0, 3, 1),
      interceptions: randInt(0, 1),
      forced_fumbles: randInt(0, 1),
      fumble_recoveries: randInt(0, 1),
      safeties: 0,
      passes_defended: randInt(0, 3),
    },
  };
}

function generateNHLStats(position: string): Record<string, unknown> {
  if (position === "G") {
    return {
      total: {
        goals: 0,
        assists: randInt(0, 1),
        shots: 0,
        blocked_shots: 0,
        saves: randInt(18, 42),
        goals_against: randInt(1, 5),
        credit: Math.random() > 0.5 ? "win" : undefined,
      },
      shootout: { goals: 0 },
    };
  }
  const isDefenseman = position === "D";
  return {
    total: {
      goals: randInt(0, isDefenseman ? 1 : 3),
      assists: randInt(0, isDefenseman ? 2 : 3),
      shots: randInt(1, isDefenseman ? 5 : 8),
      blocked_shots: randInt(0, isDefenseman ? 4 : 2),
      saves: 0,
      goals_against: 0,
    },
    shootout: { goals: randInt(0, 1) },
  };
}

function generateMLBStats(position: string): Record<string, unknown> {
  if (position === "SP") {
    const ip = randFloat(3, 9, 0);
    const isGoodStart = Math.random() > 0.4;
    return {
      pitching: {
        overall: {
          ip_2: ip,
          outs: { ktotal: randInt(2, 12) },
          games: {
            win: isGoodStart ? 1 : 0,
            complete: ip >= 9 ? 1 : 0,
            shutout:
              ip >= 9 && isGoodStart ? (Math.random() > 0.7 ? 1 : 0) : 0,
          },
          runs: { earned: randInt(0, 6) },
          onbase: {
            h: randInt(2, 10),
            bb: randInt(0, 5),
            hbp: randInt(0, 1),
          },
        },
      },
    };
  }
  return {
    hitting: {
      overall: {
        onbase: {
          s: randInt(0, 3),
          d: randInt(0, 2),
          t: Math.random() > 0.9 ? 1 : 0,
          hr: randInt(0, 2),
          bb: randInt(0, 2),
          hbp: Math.random() > 0.85 ? 1 : 0,
        },
        rbi: randInt(0, 4),
        runs: { total: randInt(0, 3) },
        steal: { stolen: randInt(0, 2) },
      },
    },
  };
}

const STAT_GENERATORS: Record<
  string,
  (position: string) => Record<string, unknown>
> = {
  nba: generateNBAStats,
  nfl: generateNFLStats,
  nhl: generateNHLStats,
  mlb: generateMLBStats,
  ncaafb: generateNFLStats,
};

// ---------------------------------------------------------------------------
// Score all players on a slate, returning a full scored slate object.
// ---------------------------------------------------------------------------

function buildScoredSlate(
  slate: Record<string, unknown>
): Record<string, unknown> {
  const players = JSON.parse(
    JSON.stringify(slate.players)
  ) as Record<string, SlatePlayer>;

  const tiers = slate.tiers as SlateTier[];
  const sportMap = new Map<string, string>();
  for (const tier of tiers) {
    for (const pid of tier.players) sportMap.set(pid, tier.type);
  }

  for (const [, player] of Object.entries(players)) {
    const sport = sportMap.get(player.id) ?? player.sport ?? "nba";
    const generator = STAT_GENERATORS[sport];
    if (!generator) continue;

    const result = scorePlayer(generator(player.position), sport);
    player.score = result.total_points;
    player.stats = result;
    player.scored = true;
    player.tie_breaker = randInt(1, 100);
    player.game = { ...player.game, status: "Final" };

    const name =
      player.name ||
      `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim();
    console.log(
      `    ${name.padEnd(25)} ${sport.toUpperCase().padEnd(6)} ${player.position.padEnd(4)} → ${result.total_points} pts`
    );
  }

  return { ...slate, players, updated: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("Scanning USER_CONTESTS for live slates...\n");

  const userContestsSnap = await firestore
    .collection(Collections.USER_CONTESTS)
    .get();

  if (userContestsSnap.empty) {
    console.error(
      "No USER_CONTESTS found. Join some contests and complete drafts first."
    );
    process.exit(1);
  }

  // Collect unique slates from live-stage contests.
  const rawSlates = new Map<string, Record<string, unknown>>();
  const slateNames = new Map<string, string>();

  for (const userDoc of userContestsSnap.docs) {
    const contests = userDoc.data().contests as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (!contests) continue;

    for (const contest of Object.values(contests)) {
      if (contest.stage !== "live") continue;
      const slate = contest.slate as Record<string, unknown> | undefined;
      if (!slate?.id || !slate?.players || !slate?.tiers) continue;

      const slateId = slate.id as string;
      if (!rawSlates.has(slateId)) {
        rawSlates.set(slateId, slate);
        slateNames.set(
          slateId,
          (slate.name as string) || (contest.slate_name as string) || slateId
        );
      }
    }
  }

  if (rawSlates.size === 0) {
    console.error(
      "No live-stage contests found. Make sure drafts are completed (stage === 'live')."
    );
    process.exit(1);
  }

  console.log(`Found ${rawSlates.size} unique live slate(s).\n`);

  // Score each slate once, then propagate via updatePlayerScores (production path).
  for (const [slateId, rawSlate] of rawSlates) {
    const name = slateNames.get(slateId)!;
    const playerCount = Object.keys(
      rawSlate.players as Record<string, unknown>
    ).length;
    console.log(`── ${name} (${playerCount} players, id=${slateId}) ──`);

    const scoredSlate = buildScoredSlate(rawSlate);

    console.log(`\n  Propagating via updatePlayerScores...`);
    await updatePlayerScores(scoredSlate);
    console.log(`  Done.\n`);
  }

  console.log("All slates scored and propagated.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error mock-scoring slates:", e);
    process.exit(1);
  });
