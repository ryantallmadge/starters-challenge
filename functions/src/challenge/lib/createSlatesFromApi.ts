/**
 * Shared logic for creating NBA + Soccer + NFL + NCAA slates from live API-Sports data.
 *
 * NBA:     rosters fetched from the NBA v2 API.
 * Soccer:  fixtures + rosters from the API-Football v3 API.
 * NFL/NCAA: games + rosters from the American Football v1 API.
 */
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { firestore, Collections } from "../../admin.js";
import { scoringSystems } from "./scoringSystems.js";
import type { SlatePlayer, SlateTier, Slate, ScoringSystem } from "../../types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = "bb6d936c6f79326a69ec844448490f71";
const PLAYERS_PER_TIER = 4;
const TIERS_PER_SLATE = 6;
const RATE_LIMIT_MS = 700;

const nbaApi = axios.create({
  baseURL: "https://v2.nba.api-sports.io",
  headers: { "x-apisports-key": API_KEY },
});

const footballApi = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  headers: { "x-apisports-key": API_KEY },
});

const americanFootballApi = axios.create({
  baseURL: "https://v1.american-football.api-sports.io",
  headers: { "x-apisports-key": API_KEY },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type SportKey = "nba" | "soccer" | "nfl" | "ncaafb";
type PosGroup = "Guard" | "Forward" | "Center"
  | "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
  | "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

interface NormalizedGame {
  id: number;
  dateStart: string;
  timestamp: number;
  venue: string | null;
  home: { id: number; name: string; code: string };
  away: { id: number; name: string; code: string };
}

interface EnrichedPlayer {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  teamAbrev: string;
  game: { time: string; id: string; title: string; date: string };
  posGroup: PosGroup;
  sport: SportKey;
}

function gameTitle(g: NormalizedGame): string {
  return `${g.away.code} @ ${g.home.code}`;
}

interface TierTemplate {
  question: string;
  key_stat: string;
  posGroups: PosGroup[];
}

interface SlateDef {
  name: string;
  description: string;
  sport: SportKey;
  entry_cost: number;
  payout: number;
  max_entries: number;
  slate_type?: "daily_free";
  single_entry?: boolean;
}

export type SlateMode = "paid" | "free";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function formatTime(utcTimeStr: string): string {
  const d = new Date(utcTimeStr);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const mm = minutes < 10 ? "0" + minutes : String(minutes);
  return `${hours}:${mm} ${ampm}`;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// ============================================================================
//  NBA  (v2 API — https://v2.nba.api-sports.io)
// ============================================================================

const NBA_PLAYER_SEASON = 2024;

function nbaPosGroup(pos: string | null): PosGroup {
  if (!pos) return "Forward";
  const p = pos.toLowerCase();
  if (p.startsWith("g") || p.includes("-g")) return "Guard";
  if (p.startsWith("c") || p.includes("-c")) return "Center";
  return "Forward";
}

interface NbaV2Game {
  id: number;
  league: string;
  date: { start: string };
  status: { long: string; short: number };
  arena: { name: string | null; city: string | null };
  teams: {
    visitors: { id: number; name: string; code: string; logo: string };
    home: { id: number; name: string; code: string; logo: string };
  };
}

interface NbaV2Player {
  id: number;
  firstname: string;
  lastname: string;
  leagues?: {
    standard?: { pos: string | null; active: boolean };
  };
}

async function fetchNbaGames(dateStr: string): Promise<NormalizedGame[]> {
  const { data } = await nbaApi.get("/games", { params: { date: dateStr } });
  if (data.errors && Object.keys(data.errors).length) {
    console.error("  NBA API errors (games):", data.errors);
  }
  const raw: NbaV2Game[] = (data.response ?? []).filter(
    (g: NbaV2Game) => g.league === "standard",
  );
  return raw.map((g) => ({
    id: g.id,
    dateStart: g.date.start,
    timestamp: Math.floor(new Date(g.date.start).getTime() / 1000),
    venue: g.arena?.name ?? null,
    home: { id: g.teams.home.id, name: g.teams.home.name, code: g.teams.home.code },
    away: { id: g.teams.visitors.id, name: g.teams.visitors.name, code: g.teams.visitors.code },
  }));
}

async function fetchNbaPlayers(games: NormalizedGame[]): Promise<EnrichedPlayer[]> {
  const teamIds = new Set<number>();
  const teamGameMap = new Map<number, NormalizedGame>();
  const teamCodeMap = new Map<number, string>();

  for (const g of games) {
    teamIds.add(g.home.id);
    teamIds.add(g.away.id);
    teamGameMap.set(g.home.id, g);
    teamGameMap.set(g.away.id, g);
    teamCodeMap.set(g.home.id, g.home.code);
    teamCodeMap.set(g.away.id, g.away.code);
  }

  const enriched: EnrichedPlayer[] = [];

  for (const tid of Array.from(teamIds)) {
    const { data } = await nbaApi.get("/players", {
      params: { team: tid, season: NBA_PLAYER_SEASON },
    });
    if (data.errors && Object.keys(data.errors).length) {
      console.error(`  NBA API errors (team ${tid}):`, data.errors);
    }
    const players: NbaV2Player[] = data.response ?? [];
    await sleep(RATE_LIMIT_MS);

    const game = teamGameMap.get(tid)!;
    const code = teamCodeMap.get(tid)!;

    for (const p of players) {
      const pos = p.leagues?.standard?.pos ?? null;
      if (!pos) continue;

      enriched.push({
        id: String(p.id),
        first_name: p.firstname,
        last_name: p.lastname,
        position: pos,
        teamAbrev: code,
        game: {
          time: formatTime(game.dateStart),
          id: String(game.id),
          title: gameTitle(game),
          date: game.dateStart,
        },
        posGroup: nbaPosGroup(pos),
        sport: "nba",
      });
    }
  }

  return enriched;
}

const NBA_TIER_TEMPLATES: TierTemplate[] = [
  { question: "Which superstar drops the most points?", key_stat: "PPG", posGroups: ["Guard", "Forward"] },
  { question: "Which big man grabs the most boards?", key_stat: "RPG", posGroups: ["Center", "Forward"] },
  { question: "Which guard dishes the most dimes?", key_stat: "APG", posGroups: ["Guard"] },
  { question: "Which wing has the best all-around game?", key_stat: "PPG", posGroups: ["Forward"] },
  { question: "Which guard goes off tonight?", key_stat: "PPG", posGroups: ["Guard"] },
  { question: "Who wins the frontcourt battle?", key_stat: "PPG", posGroups: ["Center", "Forward"] },
  { question: "Which player fills the stat sheet?", key_stat: "PPG", posGroups: ["Guard", "Forward", "Center"] },
  { question: "Which player leads all scorers?", key_stat: "PPG", posGroups: ["Guard", "Forward", "Center"] },
];

// ============================================================================
//  Soccer  (API-Football v3 — https://v3.football.api-sports.io)
// ============================================================================

const SOCCER_LEAGUES = [
  { id: 39, season: 2025, name: "EPL" },
  { id: 140, season: 2025, name: "La Liga" },
  { id: 135, season: 2025, name: "Serie A" },
  { id: 78, season: 2025, name: "Bundesliga" },
  { id: 61, season: 2025, name: "Ligue 1" },
  { id: 253, season: 2025, name: "MLS" },
  { id: 2, season: 2025, name: "Champions League" },
];

interface FootballFixture {
  fixture: { id: number; date: string; timestamp: number; venue: { name: string | null; city: string | null } };
  league: { id: number; name: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}

interface FootballSquadPlayer {
  id: number;
  name: string;
  position: string;
  number: number | null;
}

function soccerTeamCode(name: string): string {
  return name.slice(0, 3).toUpperCase();
}

function soccerPosGroup(pos: string): PosGroup {
  switch (pos) {
    case "Goalkeeper": return "Goalkeeper";
    case "Defender": return "Defender";
    case "Midfielder": return "Midfielder";
    default: return "Attacker";
  }
}

async function fetchSoccerGames(dateStr: string): Promise<NormalizedGame[]> {
  const allGames: NormalizedGame[] = [];

  for (const league of SOCCER_LEAGUES) {
    try {
      const { data } = await footballApi.get("/fixtures", {
        params: { date: dateStr, league: league.id, season: league.season },
      });
      if (data.errors && Object.keys(data.errors).length) {
        console.error(`  Soccer API errors (${league.name}):`, data.errors);
        continue;
      }
      const fixtures: FootballFixture[] = data.response ?? [];
      for (const f of fixtures) {
        allGames.push({
          id: f.fixture.id,
          dateStart: f.fixture.date,
          timestamp: f.fixture.timestamp,
          venue: f.fixture.venue?.name ?? null,
          home: { id: f.teams.home.id, name: f.teams.home.name, code: soccerTeamCode(f.teams.home.name) },
          away: { id: f.teams.away.id, name: f.teams.away.name, code: soccerTeamCode(f.teams.away.name) },
        });
      }
    } catch (e) {
      console.error(`  Soccer fetch error (${league.name}):`, (e as Error).message);
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`  Soccer: ${allGames.length} fixtures across ${SOCCER_LEAGUES.length} leagues`);
  return allGames;
}

async function fetchSoccerPlayers(games: NormalizedGame[]): Promise<EnrichedPlayer[]> {
  const teamIds = new Set<number>();
  const teamGameMap = new Map<number, NormalizedGame>();
  const teamCodeMap = new Map<number, string>();

  for (const g of games) {
    teamIds.add(g.home.id);
    teamIds.add(g.away.id);
    teamGameMap.set(g.home.id, g);
    teamGameMap.set(g.away.id, g);
    teamCodeMap.set(g.home.id, g.home.code);
    teamCodeMap.set(g.away.id, g.away.code);
  }

  const enriched: EnrichedPlayer[] = [];

  for (const tid of Array.from(teamIds)) {
    try {
      const { data } = await footballApi.get("/players/squads", {
        params: { team: tid },
      });
      if (data.errors && Object.keys(data.errors).length) {
        console.error(`  Soccer API errors (squad ${tid}):`, data.errors);
        continue;
      }
      const squads: Array<{ team: { id: number; name: string }; players: FootballSquadPlayer[] }> = data.response ?? [];
      if (squads.length === 0) continue;

      const game = teamGameMap.get(tid)!;
      const code = teamCodeMap.get(tid)!;
      const players = squads[0].players;

      for (const p of players) {
        if (!p.position) continue;
        const nameParts = p.name.split(" ");
        const first_name = nameParts.slice(0, -1).join(" ") || p.name;
        const last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

        enriched.push({
          id: `soccer-${p.id}`,
          first_name,
          last_name,
          position: p.position,
          teamAbrev: code,
          game: {
            time: formatTime(game.dateStart),
            id: String(game.id),
            title: gameTitle(game),
            date: game.dateStart,
          },
          posGroup: soccerPosGroup(p.position),
          sport: "soccer",
        });
      }
    } catch (e) {
      console.error(`  Soccer squad fetch error (team ${tid}):`, (e as Error).message);
    }
    await sleep(RATE_LIMIT_MS);
  }

  return enriched;
}

const SOCCER_TIER_TEMPLATES: TierTemplate[] = [
  { question: "Which attacker scores the most goals?", key_stat: "Goals", posGroups: ["Attacker"] },
  { question: "Which midfielder runs the show?", key_stat: "Key Passes", posGroups: ["Midfielder"] },
  { question: "Which defender keeps a clean sheet?", key_stat: "Tackles", posGroups: ["Defender"] },
  { question: "Which goalkeeper makes the most saves?", key_stat: "Saves", posGroups: ["Goalkeeper"] },
  { question: "Which player has the biggest impact?", key_stat: "Goals", posGroups: ["Attacker", "Midfielder"] },
  { question: "Who dominates the midfield battle?", key_stat: "Passes", posGroups: ["Midfielder", "Defender"] },
  { question: "Which forward provides the most assists?", key_stat: "Assists", posGroups: ["Attacker", "Midfielder"] },
  { question: "Who is the best player on the pitch?", key_stat: "Goals", posGroups: ["Attacker", "Midfielder", "Defender"] },
];

// ============================================================================
//  NFL & NCAA  (American Football v1 — https://v1.american-football.api-sports.io)
// ============================================================================

const NFL_LEAGUE_ID = 1;
const NCAA_LEAGUE_ID = 2;
const AF_SEASON = 2024;

interface AfApiGame {
  game: {
    id: number;
    stage: string;
    week: string;
    date: { timezone: string; date: string; time: string; timestamp: number };
    venue: { name: string | null; city: string | null };
    status: { short: string; long: string };
  };
  league: { id: number; name: string; season: string };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}

interface AfApiPlayer {
  id: number;
  name: string;
  group: string | null;
  position: string | null;
  number: number | null;
}

function afTeamCode(name: string): string {
  return name.slice(0, 3).toUpperCase();
}

function afPosGroup(pos: string | null, group: string | null): PosGroup {
  if (!pos) return "WR";
  switch (pos) {
    case "QB": return "QB";
    case "RB": case "FB": return "RB";
    case "WR": return "WR";
    case "TE": return "TE";
    case "PK": return "K";
    default:
      if (group === "Defense" || group === "Special Teams") return "DEF";
      return "WR";
  }
}

function isSkillPosition(pos: string | null): boolean {
  return pos === "QB" || pos === "RB" || pos === "FB" || pos === "WR" || pos === "TE" || pos === "PK";
}

async function fetchAfGames(
  dateStr: string,
  leagueId: number,
): Promise<NormalizedGame[]> {
  try {
    const { data } = await americanFootballApi.get("/games", {
      params: { date: dateStr, league: leagueId, season: AF_SEASON },
    });
    if (data.errors && Object.keys(data.errors).length) {
      const errObj = data.errors as Record<string, string>;
      if (errObj.plan) {
        const { data: fallback } = await americanFootballApi.get("/games", {
          params: { date: dateStr },
        });
        if (fallback.errors && Object.keys(fallback.errors).length) {
          console.error(`  AF API errors (league ${leagueId}):`, fallback.errors);
          return [];
        }
        const all: AfApiGame[] = fallback.response ?? [];
        const filtered = all.filter((g) => g.league.id === leagueId);
        return filtered.map(normalizeAfGame);
      }
      console.error(`  AF API errors (league ${leagueId}):`, data.errors);
      return [];
    }
    const raw: AfApiGame[] = data.response ?? [];
    return raw.map(normalizeAfGame);
  } catch (e) {
    console.error(`  AF fetch error (league ${leagueId}):`, (e as Error).message);
    return [];
  }
}

function normalizeAfGame(g: AfApiGame): NormalizedGame {
  return {
    id: g.game.id,
    dateStart: `${g.game.date.date}T${g.game.date.time}`,
    timestamp: g.game.date.timestamp,
    venue: g.game.venue?.name ?? null,
    home: { id: g.teams.home.id, name: g.teams.home.name, code: afTeamCode(g.teams.home.name) },
    away: { id: g.teams.away.id, name: g.teams.away.name, code: afTeamCode(g.teams.away.name) },
  };
}

async function fetchAfPlayers(
  games: NormalizedGame[],
  sport: SportKey,
): Promise<EnrichedPlayer[]> {
  const teamIds = new Set<number>();
  const teamGameMap = new Map<number, NormalizedGame>();
  const teamCodeMap = new Map<number, string>();

  for (const g of games) {
    teamIds.add(g.home.id);
    teamIds.add(g.away.id);
    teamGameMap.set(g.home.id, g);
    teamGameMap.set(g.away.id, g);
    teamCodeMap.set(g.home.id, g.home.code);
    teamCodeMap.set(g.away.id, g.away.code);
  }

  const enriched: EnrichedPlayer[] = [];

  for (const tid of Array.from(teamIds)) {
    try {
      const { data } = await americanFootballApi.get("/players", {
        params: { team: tid, season: AF_SEASON },
      });
      if (data.errors && Object.keys(data.errors).length) {
        console.error(`  AF API errors (players team ${tid}):`, data.errors);
        continue;
      }
      const players: AfApiPlayer[] = data.response ?? [];

      const game = teamGameMap.get(tid)!;
      const code = teamCodeMap.get(tid)!;

      for (const p of players) {
        if (!isSkillPosition(p.position)) continue;

        const nameParts = p.name.split(" ");
        const first_name = nameParts.slice(0, -1).join(" ") || p.name;
        const last_name = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

        enriched.push({
          id: String(p.id),
          first_name,
          last_name,
          position: p.position ?? "WR",
          teamAbrev: code,
          game: {
            time: formatTime(game.dateStart),
            id: String(game.id),
            title: gameTitle(game),
            date: game.dateStart,
          },
          posGroup: afPosGroup(p.position, p.group),
          sport,
        });
      }
    } catch (e) {
      console.error(`  AF player fetch error (team ${tid}):`, (e as Error).message);
    }
    await sleep(RATE_LIMIT_MS);
  }

  return enriched;
}

const NFL_TIER_TEMPLATES: TierTemplate[] = [
  { question: "Which QB throws for the most yards?", key_stat: "Passing Yards", posGroups: ["QB"] },
  { question: "Which running back dominates on the ground?", key_stat: "Rushing Yards", posGroups: ["RB"] },
  { question: "Which receiver goes off tonight?", key_stat: "Receiving Yards", posGroups: ["WR"] },
  { question: "Which tight end finds the end zone?", key_stat: "Touchdowns", posGroups: ["TE"] },
  { question: "Which skill player has the biggest game?", key_stat: "Fantasy Points", posGroups: ["QB", "RB", "WR"] },
  { question: "Who scores the most touchdowns?", key_stat: "Touchdowns", posGroups: ["RB", "WR", "TE"] },
  { question: "Which pass catcher racks up the most catches?", key_stat: "Receptions", posGroups: ["WR", "TE"] },
  { question: "Which player has the best all-around game?", key_stat: "Fantasy Points", posGroups: ["QB", "RB", "WR", "TE"] },
];

const NCAA_TIER_TEMPLATES: TierTemplate[] = [
  { question: "Which QB puts on a show?", key_stat: "Passing Yards", posGroups: ["QB"] },
  { question: "Which back runs wild?", key_stat: "Rushing Yards", posGroups: ["RB"] },
  { question: "Which receiver makes the big plays?", key_stat: "Receiving Yards", posGroups: ["WR"] },
  { question: "Who reaches the end zone the most?", key_stat: "Touchdowns", posGroups: ["RB", "WR", "TE"] },
  { question: "Which playmaker leads all scorers?", key_stat: "Fantasy Points", posGroups: ["QB", "RB", "WR"] },
  { question: "Which skill position player has the biggest night?", key_stat: "Fantasy Points", posGroups: ["QB", "RB", "WR", "TE"] },
  { question: "Which weapon out of the backfield dominates?", key_stat: "Total Yards", posGroups: ["RB"] },
  { question: "Which pass catcher leads the way?", key_stat: "Receptions", posGroups: ["WR", "TE"] },
];

// ============================================================================
//  Generic tier & slate builder
// ============================================================================

function toSlatePlayer(ep: EnrichedPlayer): SlatePlayer {
  return {
    id: ep.id,
    first_name: ep.first_name,
    last_name: ep.last_name,
    name: null,
    position: ep.position,
    team_abrev: ep.teamAbrev,
    league: ep.sport,
    type: "player",
    sport: ep.sport,
    game: ep.game,
    score: 0,
    tie_breaker: 0,
  };
}

function buildTiers(
  allPlayers: EnrichedPlayer[],
  templates: TierTemplate[],
  scoring: ScoringSystem,
  sport: SportKey,
  count: number,
): { tiers: SlateTier[]; players: Record<string, SlatePlayer> } {
  const byPos: Record<string, EnrichedPlayer[]> = {};
  for (const p of allPlayers) {
    if (!byPos[p.posGroup]) byPos[p.posGroup] = [];
    byPos[p.posGroup].push(p);
  }

  const usedIds = new Set<string>();
  const tiers: SlateTier[] = [];
  const playersMap: Record<string, SlatePlayer> = {};
  const tmpls = [...templates];

  for (let i = 0; i < count && tmpls.length > 0; i++) {
    const tmpl = tmpls.splice(i % tmpls.length, 1)[0];

    let pool = tmpl.posGroups
      .flatMap((pg) => byPos[pg] ?? [])
      .filter((p) => !usedIds.has(p.id));

    if (pool.length < PLAYERS_PER_TIER) {
      pool = allPlayers.filter((p) => !usedIds.has(p.id));
      if (pool.length < PLAYERS_PER_TIER) break;
    }

    const picks = pickRandom(pool, PLAYERS_PER_TIER);
    const ids = picks.map((p) => p.id);
    ids.forEach((id) => usedIds.add(id));
    for (const ep of picks) playersMap[ep.id] = toSlatePlayer(ep);

    tiers.push({
      question: tmpl.question,
      key_stat: tmpl.key_stat,
      players: ids,
      scoring_system: scoring,
      type: sport,
    });
  }

  return { tiers, players: playersMap };
}

function assembleSingleSlate(
  def: SlateDef,
  games: NormalizedGame[],
  allPlayers: EnrichedPlayer[],
  templates: TierTemplate[],
  scoring: ScoringSystem,
): { slate: Slate; meta: Record<string, unknown> } | null {
  const { tiers, players } = buildTiers(
    allPlayers, templates, scoring, def.sport, TIERS_PER_SLATE,
  );

  if (tiers.length < 3) {
    console.warn(`  ⚠  Only ${tiers.length} tiers — skipping "${def.name}"`);
    return null;
  }

  const now = new Date();
  const earliestTs = games.reduce(
    (min, g) => (g.timestamp < min ? g.timestamp : min),
    Infinity,
  );
  const start = new Date(earliestTs * 1000);
  const end = new Date(start);
  end.setHours(end.getHours() + 6);

  const id = uuidv4();
  const slate: Slate = {
    id,
    start: start.toISOString(),
    end: end.toISOString(),
    players,
    tiers,
    created_at: now.toISOString(),
    entry_cost: def.entry_cost,
    payout: def.payout,
    ...(def.slate_type && { slate_type: def.slate_type }),
    ...(def.single_entry && { single_entry: def.single_entry }),
  };

  const meta = {
    name: def.name,
    sport: def.sport,
    description: def.description,
    status: "open",
    start_time: start.toISOString(),
    entry_count: 0,
    max_entries: def.max_entries,
    game_count: games.length,
    entry_cost: def.entry_cost,
    payout: def.payout,
    created_at: now.toISOString(),
    ...(def.slate_type && { slate_type: def.slate_type }),
    ...(def.single_entry && { single_entry: def.single_entry }),
  };

  return { slate, meta };
}

// ============================================================================
//  Public entry points
// ============================================================================

interface SportBundle {
  games: NormalizedGame[];
  players: EnrichedPlayer[];
  templates: TierTemplate[];
  scoring: ScoringSystem;
  sport: SportKey;
}

async function loadBundles(dateStr: string): Promise<SportBundle[]> {
  const [nbaGames, soccerGames, nflGames, ncaaGames] = await Promise.all([
    fetchNbaGames(dateStr),
    fetchSoccerGames(dateStr),
    fetchAfGames(dateStr, NFL_LEAGUE_ID),
    fetchAfGames(dateStr, NCAA_LEAGUE_ID),
  ]);

  console.log(
    `[createSlates] ${dateStr}  NBA: ${nbaGames.length}  |  Soccer: ${soccerGames.length}` +
    `  |  NFL: ${nflGames.length}  |  NCAA: ${ncaaGames.length}`,
  );

  const bundles: SportBundle[] = [];

  if (nbaGames.length > 0) {
    const nbaPlayers = await fetchNbaPlayers(nbaGames);
    console.log(`  NBA: ${nbaPlayers.length} players loaded`);
    if (nbaPlayers.length >= PLAYERS_PER_TIER) {
      bundles.push({
        games: nbaGames,
        players: nbaPlayers,
        templates: NBA_TIER_TEMPLATES,
        scoring: scoringSystems.nba,
        sport: "nba",
      });
    }
  }

  if (soccerGames.length > 0) {
    const soccerPlayers = await fetchSoccerPlayers(soccerGames);
    console.log(`  Soccer: ${soccerPlayers.length} players loaded`);
    if (soccerPlayers.length >= PLAYERS_PER_TIER) {
      bundles.push({
        games: soccerGames,
        players: soccerPlayers,
        templates: SOCCER_TIER_TEMPLATES,
        scoring: scoringSystems.soccer,
        sport: "soccer",
      });
    }
  }

  if (nflGames.length > 0) {
    const nflPlayers = await fetchAfPlayers(nflGames, "nfl");
    console.log(`  NFL: ${nflPlayers.length} players loaded`);
    if (nflPlayers.length >= PLAYERS_PER_TIER) {
      bundles.push({
        games: nflGames,
        players: nflPlayers,
        templates: NFL_TIER_TEMPLATES,
        scoring: scoringSystems.nfl,
        sport: "nfl",
      });
    }
  }

  if (ncaaGames.length > 0) {
    const ncaaPlayers = await fetchAfPlayers(ncaaGames, "ncaafb");
    console.log(`  NCAA: ${ncaaPlayers.length} players loaded`);
    if (ncaaPlayers.length >= PLAYERS_PER_TIER) {
      bundles.push({
        games: ncaaGames,
        players: ncaaPlayers,
        templates: NCAA_TIER_TEMPLATES,
        scoring: scoringSystems.ncaafb,
        sport: "ncaafb",
      });
    }
  }

  return bundles;
}

function paidDefs(dateStr: string, sport: SportKey): SlateDef[] {
  const label = sport.toUpperCase();
  return [
    {
      name: `${label} ${dateStr} Main Slate`,
      sport,
      description: `Tonight's full ${label} slate — pick the players who dominate.`,
      entry_cost: 10, payout: 18, max_entries: 200,
    },
    {
      name: `${label} ${dateStr} High Roller`,
      sport,
      description: "Big buy-in, bigger payout. Only for the bold.",
      entry_cost: 25, payout: 45, max_entries: 100,
    },
  ];
}

function freeDefs(sport: SportKey): SlateDef[] {
  const label = sport.toUpperCase();
  return [
    {
      name: `${label} Daily Free Challenge`,
      sport,
      description: "Free to enter, 100 coins to win — one shot per day!",
      entry_cost: 0, payout: 100, max_entries: 500,
      slate_type: "daily_free", single_entry: true,
    },
  ];
}

async function writeSlates(
  bundles: SportBundle[],
  defsForBundle: (b: SportBundle, dateStr: string) => SlateDef[],
  dateStr: string,
): Promise<number> {
  const writes: Promise<FirebaseFirestore.WriteResult>[] = [];
  let setCurrentSlate = true;

  for (const bundle of bundles) {
    const defs = defsForBundle(bundle, dateStr);
    for (const def of defs) {
      const result = assembleSingleSlate(
        def, bundle.games, bundle.players, bundle.templates, bundle.scoring,
      );
      if (!result) continue;
      const { slate, meta } = result;

      writes.push(
        firestore
          .collection(Collections.AVAILABLE_SLATES)
          .doc(slate.id)
          .set({ ...slate, ...meta }),
      );

      if (setCurrentSlate) {
        writes.push(
          firestore.collection(Collections.SLATES).doc("current").set(slate),
        );
        setCurrentSlate = false;
      }

      console.log(`  [${def.sport.toUpperCase()}] ${def.name}  (${slate.tiers.length} tiers, ${Object.keys(slate.players).length} players)`);
    }
  }

  await Promise.all(writes);
  return writes.length;
}

/**
 * Create next-day paid slates (Main + High Roller) for NBA & NHL.
 * Intended to run at 8 PM Eastern.
 */
export async function createNextDaySlates(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  console.log(`[createNextDaySlates] Building paid slates for ${dateStr}`);
  const bundles = await loadBundles(dateStr);

  if (bundles.length === 0) {
    console.log("  No games found — nothing to create.");
    return;
  }

  const count = await writeSlates(
    bundles,
    (b, ds) => paidDefs(ds, b.sport),
    dateStr,
  );
  console.log(`[createNextDaySlates] Done — wrote ${count} documents.`);
}

/**
 * Create a single same-day free challenge slate, randomly picking one sport
 * from whichever have games that day.
 * Intended to run at 4 AM Eastern.
 */
export async function createDailyFreeSlates(): Promise<void> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  console.log(`[createDailyFreeSlates] Building free slate for ${dateStr}`);
  const bundles = await loadBundles(dateStr);

  if (bundles.length === 0) {
    console.log("  No games found — nothing to create.");
    return;
  }

  const picked = bundles[Math.floor(Math.random() * bundles.length)];
  console.log(`  Randomly selected ${picked.sport.toUpperCase()} for today's free challenge`);

  const count = await writeSlates(
    [picked],
    (b) => freeDefs(b.sport),
    dateStr,
  );
  console.log(`[createDailyFreeSlates] Done — wrote ${count} documents.`);
}

/**
 * Create all slates (paid + free) for a given date. Used by the CLI script.
 */
export async function createAllSlatesForDate(dateStr: string): Promise<void> {
  console.log(`[createAllSlates] Building all slates for ${dateStr}`);
  const bundles = await loadBundles(dateStr);

  if (bundles.length === 0) {
    console.log("  No games found — nothing to create.");
    return;
  }

  // Clear existing slates when running the full script
  const snapAvail = await firestore.collection(Collections.AVAILABLE_SLATES).get();
  const snapSlates = await firestore.collection(Collections.SLATES).get();
  const delBatch = firestore.batch();
  snapAvail.docs.forEach((d) => delBatch.delete(d.ref));
  snapSlates.docs.forEach((d) => delBatch.delete(d.ref));
  await delBatch.commit();
  console.log(`  Cleared ${snapAvail.size + snapSlates.size} old docs`);

  // Paid slates for every sport with games
  let count = await writeSlates(
    bundles,
    (b, ds) => paidDefs(ds, b.sport),
    dateStr,
  );

  // One free challenge for a randomly picked sport
  const freePick = bundles[Math.floor(Math.random() * bundles.length)];
  console.log(`  Randomly selected ${freePick.sport.toUpperCase()} for free challenge`);
  count += await writeSlates(
    [freePick],
    (b) => freeDefs(b.sport),
    dateStr,
  );

  const sportList = bundles.map((b) => b.sport.toUpperCase()).join(" + ");
  console.log(`[createAllSlates] Done — wrote ${count} documents across ${sportList}.`);
}
