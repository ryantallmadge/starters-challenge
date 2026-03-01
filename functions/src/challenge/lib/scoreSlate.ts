import { getSportsRadarConfig } from "../../utils/sportsRadarConfig.js";
import { scoringSystems } from "./scoringSystems.js";
import { scoringSystemsTeam } from "./scoringSystemsTeam.js";
import { firestore, Collections } from "../../admin.js";
import axios from "axios";
import _ from "lodash";
import type { ScoringSystemsBySport, ScoredPlayerResult, SportRadarConfig, SlatePlayer } from "../../types.js";

function getStatFromKey(
  stats: Record<string, unknown>,
  objectKey: string
): { stat_value?: unknown; last_key?: string } {
  const keys = objectKey.split(".");
  let tempValue: unknown = null;
  let lastKey: string | null = null;
  for (const key of keys) {
    lastKey = key;
    if (tempValue) {
      if ((tempValue as Record<string, unknown>)[key]) {
        tempValue = (tempValue as Record<string, unknown>)[key];
        continue;
      }
    } else if (!tempValue && stats[key]) {
      tempValue = stats[key];
      continue;
    }
    return {};
  }
  return { stat_value: tempValue, last_key: lastKey ?? undefined };
}

function calculateScore(
  stats: Record<string, unknown>,
  sport: string,
  scoringSystem: ScoringSystemsBySport
): ScoredPlayerResult {
  const scoredStats: Record<string, { value: number; points: number }> = {};
  let totalPoints = 0;
  const sportSystem = scoringSystem[sport];
  if (!sportSystem) return { scored_stats: scoredStats, total_points: 0 };
  const scoreKeys = Object.keys(sportSystem);

  for (const key of scoreKeys) {
    let points = 0;
    const currentStat = sportSystem[key].key;
    const currentScore = sportSystem[key].score;
    const currentValue = sportSystem[key].value;

    const { stat_value = 0 } = getStatFromKey(stats, currentStat);

    if (currentValue === stat_value) {
      totalPoints += currentScore;
      points += currentScore;
    } else if (stat_value) {
      const score = (stat_value as number) * currentScore;
      points += score;
      totalPoints += score;
    }
    if (stat_value) {
      scoredStats[key] = {
        value: stat_value as number,
        points: points ? parseFloat(points.toFixed(2)) : 0,
      };
    }
  }
  return {
    scored_stats: scoredStats,
    total_points: parseFloat(totalPoints.toFixed(2)),
  };
}

export function scorePlayer(
  stats: Record<string, unknown>,
  sport: string
): ScoredPlayerResult {
  return calculateScore(stats, sport, scoringSystems);
}

export function scoreTeam(
  stats: Record<string, unknown>,
  sport: string
): ScoredPlayerResult {
  return calculateScore(stats, sport, scoringSystemsTeam);
}

function toOrdinalSuffix(num: number): string {
  const int = Math.floor(num);
  const digits = [int % 10, int % 100];
  const ordinals = ["st", "nd", "rd", "th"];
  const oPattern = [1, 2, 3, 4];
  const tPattern = [11, 12, 13, 14, 15, 16, 17, 18, 19];
  return oPattern.includes(digits[0]) && !tPattern.includes(digits[1])
    ? int + ordinals[digits[0] - 1]
    : int + ordinals[3];
}

function getGameDetails(sport: string, game: Record<string, unknown>): string {
  if (game.status === "halftime") return "Halftime";
  if (game.status !== "inprogress") return "Final";

  if (sport === "mlb") {
    const outcome = game.outcome as Record<string, unknown>;
    return `${outcome.current_inning_half === "T" ? "Top" : "Bottom"} of the ${toOrdinalSuffix(outcome.current_inning as number)}`;
  }
  if (sport === "nba") return `${game.quarter}Q | ${game.clock}`;
  if (sport === "nhl") return `${toOrdinalSuffix(game.period as number)} | ${game.clock}`;
  if (sport === "nfl") return `${game.quarter}Q | ${game.clock}`;
  return game.time as string;
}

interface NFLPlayerStats {
  [playerId: string]: Record<string, unknown>;
}

function getNFLGameStats(stats: Record<string, unknown>): NFLPlayerStats {
  const playersById: NFLPlayerStats = {};
  const categories = ["rushing", "receiving", "passing", "fumbles", "punt_returns", "defense"];

  for (const category of categories) {
    const catData = stats[category] as Record<string, unknown> | undefined;
    if (catData?.players) {
      for (const player of catData.players as Array<Record<string, unknown>>) {
        const id = player.id as string;
        const existing = playersById[id] || {};
        if (category === "rushing") {
          playersById[id] = { ...existing, rushing: { touchdowns: player.touchdowns, yards: player.yards } };
        } else if (category === "receiving") {
          playersById[id] = { ...existing, receiving: { touchdowns: player.touchdowns, receptions: player.receptions, yards: player.yards } };
        } else if (category === "passing") {
          playersById[id] = { ...existing, passing: { touchdowns: player.touchdowns, interceptions: player.interceptions, yards: player.yards } };
        } else if (category === "fumbles") {
          playersById[id] = { ...existing, fumbles: { fumbles: player.fumbles } };
        } else if (category === "punt_returns") {
          playersById[id] = { ...existing, punt_returns: { touchdowns: player.touchdowns } };
        } else if (category === "defense") {
          playersById[id] = {
            ...existing,
            defense: {
              assists: player.assists, sacks: player.sacks, tackles: player.tackles,
              interceptions: player.interceptions, passes_defended: player.passes_defended,
              forced_fumbles: player.forced_fumbles, fumble_recoveries: player.fumble_recoveries,
              tloss: player.tloss, safeties: player.safeties,
            },
          };
        }
      }
    }
  }

  const extraPoints = stats.extra_points as Record<string, unknown> | undefined;
  if (extraPoints?.conversions) {
    const conversions = extraPoints.conversions as Record<string, unknown>;
    if (conversions.players) {
      for (const player of conversions.players as Array<Record<string, unknown>>) {
        const id = player.id as string;
        const existing = playersById[id] || {};
        playersById[id] = {
          ...existing,
          conversions: { [`${player.category}_successes`]: player.successes },
        };
      }
    }
  }

  return playersById;
}

async function getNFLGame(
  gameId: string,
  config: SportRadarConfig
): Promise<Record<string, unknown> | null> {
  const { key, access_level, version } = config.nfl;
  try {
    const { data } = await axios.get(
      `https://api.sportradar.us/nfl/official/${access_level}/${version}/en/games/${gameId}/statistics.json?api_key=${key}`
    );

    const game: Record<string, unknown> = {
      id: data.id,
      clock: data.clock,
      quarter: data.quarter,
      status: data.status,
      away: { players: [] as unknown[] },
      home: { players: [] as unknown[] },
    };

    if (data.statistics) {
      if (data.statistics.home) {
        const homePlayers = getNFLGameStats(data.statistics.home);
        (game.home as Record<string, unknown>).players = Object.keys(homePlayers).map((pid) => ({
          id: pid,
          statistics: homePlayers[pid],
        }));
      }
      if (data.statistics.away) {
        const awayPlayers = getNFLGameStats(data.statistics.away);
        (game.away as Record<string, unknown>).players = Object.keys(awayPlayers).map((pid) => ({
          id: pid,
          statistics: awayPlayers[pid],
        }));
      }
    }

    return game;
  } catch (e) {
    console.error("NFL game fetch error:", (e as Error).message);
    return null;
  }
}

async function getGame(
  sport: string,
  gameId: string,
  config: SportRadarConfig
): Promise<Record<string, unknown> | null> {
  if (sport === "nfl") return getNFLGame(gameId, config);

  const { key, access_level, version } = config[sport];
  try {
    const res = await axios.get(
      `https://api.sportradar.us/${sport}/${access_level}/${version}/en/games/${gameId}/summary.json?api_key=${key}`
    );
    return res.data.game ? res.data.game : res.data;
  } catch (e) {
    console.error(`${sport} game fetch error:`, (e as Error).message);
    return null;
  }
}

interface GameBucket {
  players: SlatePlayer[];
  sport: string;
  game: Record<string, unknown> | null;
}

export async function scoreSlate(): Promise<{ scored: boolean }> {
  const config = await getSportsRadarConfig();

  const liveSlateSnap = await firestore
    .collection(Collections.SLATES)
    .doc("live")
    .get();
  const liveSlate = liveSlateSnap.data();
  if (!liveSlate) return { scored: false };

  const gameIds: Record<string, GameBucket> = {};
  const slatePlayers = liveSlate.players;

  for (const tier of liveSlate.tiers) {
    for (const playerInTier of tier.players) {
      const player = slatePlayers[playerInTier];
      if (!player?.game?.id) continue;
      if (!gameIds[player.game.id]) {
        gameIds[player.game.id] = { players: [], sport: tier.type, game: null };
      }
      gameIds[player.game.id].players.push(player);
    }
  }

  const getGamesRefs = Object.keys(gameIds).map((gameId) => {
    const { sport } = gameIds[gameId];
    return getGame(sport, gameId, config);
  });

  const games = await Promise.all(getGamesRefs);

  const gameIdKeys = Object.keys(gameIds);
  for (let i = 0; i < gameIdKeys.length; i++) {
    const game = games[i];
    if (game) gameIds[gameIdKeys[i]].game = game;
  }

  let scored = false;

  for (const gameId of Object.keys(gameIds)) {
    const { sport, game, players } = gameIds[gameId];
    if (!game) continue;
    if (game.status === "scheduled" || (game.status as string).includes("created")) continue;

    scored = true;
    const teamPlayers: Record<string, Record<string, unknown>> = {};

    const away = game.away as Record<string, unknown> | undefined;
    const home = game.home as Record<string, unknown> | undefined;

    if (away?.id && slatePlayers[away.id as string]) {
      teamPlayers[away.id as string] = { id: away.id, statistics: away.statistics };
    }
    if (home?.id && slatePlayers[home.id as string]) {
      teamPlayers[home.id as string] = { id: home.id, statistics: home.statistics };
    }

    if (away?.players) {
      for (const player of away.players as Array<Record<string, unknown>>) {
        if (slatePlayers[player.id as string]) {
          teamPlayers[player.id as string] = player;
        }
      }
    }

    if (home?.players) {
      for (const player of home.players as Array<Record<string, unknown>>) {
        if (slatePlayers[player.id as string]) {
          teamPlayers[player.id as string] = player;
        }
      }

      for (const player of players) {
        slatePlayers[player.id].scored = true;
        slatePlayers[player.id].game.status = getGameDetails(sport, game);
      }
    }

    for (const teamPlayerId of Object.keys(teamPlayers)) {
      const teamPlayer = teamPlayers[teamPlayerId];
      if (teamPlayer.statistics) {
        let stats = teamPlayer.statistics as Record<string, unknown>;
        if (sport === "nhl") {
          stats = _.merge(stats, (teamPlayer as Record<string, unknown>).goaltending || {});
        }
        const playerScore = scorePlayer(stats, sport);
        slatePlayers[teamPlayer.id as string].score = playerScore.total_points;
        slatePlayers[teamPlayer.id as string].stats = playerScore;
      }
    }
  }

  if (scored) {
    await firestore
      .collection(Collections.SLATES)
      .doc("live")
      .set({
        ...liveSlate,
        players: slatePlayers,
        updated: new Date().toISOString(),
      });
  }

  return { scored };
}
