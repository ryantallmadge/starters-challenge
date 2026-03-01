import { onRequest } from "firebase-functions/v2/https";
import { returnJson } from "../../utils/returnJson.js";
import { firestore, Collections } from "../../admin.js";
import { getSportsRadarConfig } from "../../utils/sportsRadarConfig.js";
import { v4 as uuidv4 } from "uuid";
import { scoringSystems } from "../lib/scoringSystems.js";
import { scoringSystemsTeam } from "../lib/scoringSystemsTeam.js";
import axios from "axios";
import type { SportRadarConfig } from "../../types.js";

let sportRadarConfig: SportRadarConfig | null = null;

function formatAMPM(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minuteStr = minutes < 10 ? "0" + minutes : String(minutes);
  return hours + ":" + minuteStr + " " + ampm;
}

function getPlayerStringSplit(playerString: string): [string, string] {
  const split = playerString.split("~");
  if (!split[1]) split[1] = "player";
  return [split[0], split[1]];
}

const sleep = (m: number) => new Promise((r) => setTimeout(r, m));

function getPlayerURL(api: string, playerId: string): string {
  const { key, access_level, version } = sportRadarConfig![api];
  if (api === "nfl") {
    return `https://api.sportradar.us/nfl/official/${access_level}/${version}/en/players/${playerId}/profile.json?api_key=${key}`;
  }
  return `https://api.sportradar.us/${api}/${access_level}/${version}/en/players/${playerId}/profile.json?api_key=${key}`;
}

function getTeamURL(api: string, teamId: string): string {
  const { key, access_level, version } = sportRadarConfig![api];
  if (api === "nfl") {
    return `https://api.sportradar.us/nfl/official/${access_level}/${version}/en/teams/${teamId}/profile.json?api_key=${key}`;
  }
  if (api === "ncaafb") {
    return `https://api.sportradar.us/ncaafb-p1/teams/${teamId}/roster.json?api_key=${key}`;
  }
  return `https://api.sportradar.us/${api}/${access_level}/${version}/en/teams/${teamId}/profile.json?api_key=${key}`;
}

export const submitSlateFn = onRequest(async (req, res) => {
  const slateInput = req.body as Record<string, Record<string, unknown>>;
  sportRadarConfig = await getSportsRadarConfig();

  const tiers = [1, 2, 3, 4, 5];
  const getGames: Array<Promise<unknown>> = [];
  const getPlayers: Array<() => Promise<unknown[]>> = [];

  for (const tier of tiers) {
    const currentTier = slateInput[`tier${tier}`] as Record<string, unknown>;
    if (!currentTier) continue;
    const sport = currentTier.sport as string;
    const games = currentTier.games as string[];
    const players = currentTier.players as string[];

    getGames.push(
      Promise.all(
        games.map((gId) => {
          const { key, access_level } = sportRadarConfig![sport];
          return axios.get(
            `https://api.sportradar.us/${sport}/${access_level}/v7/en/games/${gId}/summary.json?api_key=${key}`
          );
        })
      )
    );

    getPlayers.push(async () => {
      const results: unknown[] = [];
      for (const ps of players) {
        const [id, type] = getPlayerStringSplit(ps);
        const url =
          type === "team"
            ? getTeamURL(sport, id)
            : getPlayerURL(sport, id);
        const r = await axios.get(url);
        results.push({ ...r.data, sport, type });
        await sleep(500);
      }
      return results;
    });
  }

  await Promise.all(getGames);

  const playersById: Record<string, Record<string, unknown>> = {};
  const gamesForTeamId: Record<string, Record<string, unknown>> = {};
  const gameDates: Date[] = [];
  const builtTiers: unknown[] = [];

  for (const tier of tiers) {
    const currentTier = slateInput[`tier${tier}`] as Record<string, unknown>;
    if (!currentTier) continue;
    const sport = currentTier.sport as string;
    const playerStrings = currentTier.players as string[];

    const firstPlayer = playerStrings[0];
    if (!firstPlayer) continue;
    const [, firstType] = getPlayerStringSplit(firstPlayer);

    const scoringSystem =
      firstType === "team"
        ? scoringSystemsTeam[sport]
        : scoringSystems[sport];

    builtTiers.push({
      key_stat: currentTier.title || "",
      players: playerStrings.map((p) => getPlayerStringSplit(p)[0]),
      question: currentTier.title || "",
      scoring_system: scoringSystem,
      type: sport,
      video: "",
    });
  }

  const slatePlayers: Record<string, unknown> = {};
  for (const id of Object.keys(playersById)) {
    const player = playersById[id];
    slatePlayers[id] = {
      first_name: player.first_name || "",
      last_name: player.last_name || player.name || "",
      name: player.name || null,
      id: player.id,
      score: 0,
      tie_breaker: 0,
      type: player.type,
    };
  }

  const createSlate = {
    start: new Date().toISOString(),
    end: new Date().toISOString(),
    players: slatePlayers,
    tiers: builtTiers,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  };

  await firestore
    .collection(Collections.SLATES)
    .doc("upcoming")
    .set(createSlate);

  returnJson(res, createSlate);
});
