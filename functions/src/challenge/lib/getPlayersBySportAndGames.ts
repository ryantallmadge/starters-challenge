import { getSportsRadarConfig } from "../../utils/sportsRadarConfig.js";
import axios from "axios";
import type { SportRadarConfig } from "../../types.js";

let sportRadarConfig: SportRadarConfig | null = null;

const sleep = (m: number) => new Promise((r) => setTimeout(r, m));

function formatAMPM(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minuteStr = minutes < 10 ? "0" + minutes : String(minutes);
  return hours + ":" + minuteStr + " " + ampm;
}

function getGameURL(api: string, gameId: string): string {
  const { key, access_level } = sportRadarConfig![api];
  if (api === "nfl") {
    return `https://api.sportradar.us/${api}/official/${access_level}/v6/en/games/${gameId}/statistics.json?api_key=${key}`;
  }
  if (api === "ncaafb") {
    const [home, away] = gameId.split("~");
    const { YEAR, WEEK } = sportRadarConfig![api];
    return `https://api.sportradar.us/ncaafb-p1/${YEAR}/REG/${WEEK}/${away}/${home}/statistics.json?api_key=${key}`;
  }
  return `https://api.sportradar.us/${api}/${access_level}/v7/en/games/${gameId}/summary.json?api_key=${key}`;
}

function getTeamURL(api: string, teamId: string): string {
  const { key, access_level } = sportRadarConfig![api];
  if (api === "nfl") {
    return `https://api.sportradar.us/${api}/official/${access_level}/v6/en/teams/${teamId}/full_roster.json?api_key=${key}`;
  }
  if (api === "ncaafb") {
    return `https://api.sportradar.us/ncaafb-p1/teams/${teamId}/roster.json?api_key=${key}`;
  }
  return `https://api.sportradar.us/${api}/${access_level}/v7/en/teams/${teamId}/profile.json?api_key=${key}`;
}

interface PlayerEntry {
  first_name: string;
  last_name?: string;
  game: { time: string; id: string; title: string };
  id: string;
  key_stat: number;
  league: string;
  position: string;
  score: number;
  team_abrev: string;
  thumbnail: string;
  tie_breaker: number;
  type: "player" | "team";
}

async function getPlayers(
  api: string,
  games: string[]
): Promise<Record<string, PlayerEntry[]>> {
  const playersByPosition: Record<string, PlayerEntry[]> = { TEAMS: [] };
  const summarys: Array<{ data: Record<string, unknown> }> = [];

  for (const gameId of games) {
    try {
      const summary = await axios.get(getGameURL(api, gameId));
      summarys.push(summary);
    } catch (e) {
      console.error("Game fetch error:", e);
      throw e;
    }
    await sleep(500);
  }

  const teamProfiles: Array<Promise<{ data: Record<string, unknown> }>> = [];
  const gameByTeamId: Record<string, Record<string, unknown>> = {};

  for (const summary of summarys) {
    const { data } = summary;
    let home: Record<string, unknown>;
    let away: Record<string, unknown>;
    let game: Record<string, unknown>;

    if (data.game) {
      const g = data.game as Record<string, unknown>;
      home = g.home as Record<string, unknown>;
      away = g.away as Record<string, unknown>;
      game = g;
    } else if (data.summary) {
      const s = data.summary as Record<string, unknown>;
      home = s.home as Record<string, unknown>;
      away = s.away as Record<string, unknown>;
      const scheduled = new Date(data.scheduled as string);
      scheduled.setHours(scheduled.getHours() - 4);
      game = { ...data, home, away, scheduled };
    } else {
      home = (data.home || data.home_team) as Record<string, unknown>;
      away = (data.away || data.away_team) as Record<string, unknown>;
      game = data;
    }

    const gameTime = formatAMPM(new Date(game.scheduled as string));
    const title = `${away.name}@${home.name}`;

    playersByPosition["TEAMS"].push({
      first_name: home.name as string,
      game: { time: gameTime, id: game.id as string, title },
      id: home.id as string,
      key_stat: 0,
      league: api.toUpperCase(),
      position: "TEAM",
      score: 0,
      team_abrev: home.name as string,
      thumbnail: "",
      tie_breaker: 0,
      type: "team",
    });
    playersByPosition["TEAMS"].push({
      first_name: away.name as string,
      game: { time: gameTime, id: game.id as string, title },
      id: away.id as string,
      key_stat: 0,
      league: api.toUpperCase(),
      position: "TEAM",
      score: 0,
      team_abrev: away.name as string,
      thumbnail: "",
      tie_breaker: 0,
      type: "team",
    });

    gameByTeamId[home.id as string] = game;
    gameByTeamId[away.id as string] = game;

    teamProfiles.push(axios.get(getTeamURL(api, home.id as string)));
    teamProfiles.push(axios.get(getTeamURL(api, away.id as string)));
  }

  const profiles = await Promise.all(teamProfiles);

  for (const profile of profiles) {
    const { data } = profile;
    const players = data.players as Array<Record<string, unknown>>;
    if (!players) continue;

    for (const player of players) {
      const primaryPosition = (player.primary_position || player.position) as string;
      if (!playersByPosition[primaryPosition]) {
        playersByPosition[primaryPosition] = [];
      }

      const game = gameByTeamId[data.id as string];
      const home = (game.home || game.home_team) as Record<string, unknown>;
      const away = (game.away || game.away_team) as Record<string, unknown>;

      playersByPosition[primaryPosition].push({
        first_name: (player.first_name || player.name_first) as string,
        last_name: (player.last_name || player.name_last) as string,
        game: {
          time: formatAMPM(new Date(game.scheduled as string)),
          id: game.id as string,
          title: `${(away.name as string)}@${(home.name as string)}`,
        },
        id: player.id as string,
        key_stat: 0,
        league: api.toUpperCase(),
        position: primaryPosition,
        score: 0,
        team_abrev: (data.alias || data.name) as string,
        thumbnail: "",
        tie_breaker: 0,
        type: "player",
      });
    }
  }

  return playersByPosition;
}

export async function getPlayersBySportAndGames(
  sport: string,
  games: string[]
): Promise<Record<string, PlayerEntry[]>> {
  sportRadarConfig = await getSportsRadarConfig();
  return getPlayers(sport, games);
}
