/**
 * Create multiple mock NBA basketball slates in AVAILABLE_SLATES
 * and one in SLATES/current for backward compatibility.
 *
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/createMockBasketballSlate.ts
 */
import { v4 as uuidv4 } from "uuid";
import { firestore, Collections } from "../admin.js";
import { scoringSystems } from "../challenge/lib/scoringSystems.js";
import type { SlatePlayer, SlateTier, Slate } from "../types.js";

const nbaScoringSystem = scoringSystems.nba;

type PlayerSeed = Omit<SlatePlayer, "score" | "tie_breaker" | "picked" | "scored" | "stats">;

// ---------------------------------------------------------------------------
// Player pool — 60 players across a range of teams/games
// ---------------------------------------------------------------------------

const ALL_PLAYERS: PlayerSeed[] = [
  // --- Scorers / Guards ---
  { id: "p1", first_name: "LeBron", last_name: "James", name: null, position: "SF", team_abrev: "LAL", league: "nba", type: "player", key_stat: "27.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "p2", first_name: "Stephen", last_name: "Curry", name: null, position: "PG", team_abrev: "GSW", league: "nba", type: "player", key_stat: "29.4 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png&w=350&h=254", game: { time: "7:30 pm", id: "g2", title: "GSW vs MIA" }, sport: "nba" },
  { id: "p3", first_name: "Kevin", last_name: "Durant", name: null, position: "SF", team_abrev: "PHX", league: "nba", type: "player", key_stat: "27.9 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3202.png&w=350&h=254", game: { time: "8:00 pm", id: "g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "p4", first_name: "Giannis", last_name: "Antetokounmpo", name: null, position: "PF", team_abrev: "MIL", league: "nba", type: "player", key_stat: "31.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032977.png&w=350&h=254", game: { time: "8:00 pm", id: "g4", title: "MIL vs PHI" }, sport: "nba" },

  // --- Bigs / Rebounders ---
  { id: "p5", first_name: "Nikola", last_name: "Jokic", name: null, position: "C", team_abrev: "DEN", league: "nba", type: "player", key_stat: "12.4 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3112335.png&w=350&h=254", game: { time: "8:00 pm", id: "g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "p6", first_name: "Anthony", last_name: "Davis", name: null, position: "C", team_abrev: "LAL", league: "nba", type: "player", key_stat: "12.1 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6583.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "p7", first_name: "Joel", last_name: "Embiid", name: null, position: "C", team_abrev: "PHI", league: "nba", type: "player", key_stat: "11.0 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3059318.png&w=350&h=254", game: { time: "8:00 pm", id: "g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "p8", first_name: "Bam", last_name: "Adebayo", name: null, position: "C", team_abrev: "MIA", league: "nba", type: "player", key_stat: "10.4 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066261.png&w=350&h=254", game: { time: "7:30 pm", id: "g2", title: "GSW vs MIA" }, sport: "nba" },

  // --- Playmakers ---
  { id: "p9", first_name: "Luka", last_name: "Doncic", name: null, position: "PG", team_abrev: "DAL", league: "nba", type: "player", key_stat: "9.8 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395725.png&w=350&h=254", game: { time: "8:30 pm", id: "g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "p10", first_name: "Trae", last_name: "Young", name: null, position: "PG", team_abrev: "ATL", league: "nba", type: "player", key_stat: "10.8 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4277905.png&w=350&h=254", game: { time: "7:00 pm", id: "g6", title: "ATL vs NYK" }, sport: "nba" },
  { id: "p11", first_name: "Tyrese", last_name: "Haliburton", name: null, position: "PG", team_abrev: "IND", league: "nba", type: "player", key_stat: "10.4 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4397002.png&w=350&h=254", game: { time: "7:00 pm", id: "g7", title: "IND vs CLE" }, sport: "nba" },
  { id: "p12", first_name: "James", last_name: "Harden", name: null, position: "SG", team_abrev: "LAC", league: "nba", type: "player", key_stat: "8.5 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3992.png&w=350&h=254", game: { time: "8:30 pm", id: "g5", title: "DAL vs LAC" }, sport: "nba" },

  // --- Wings ---
  { id: "p13", first_name: "Jayson", last_name: "Tatum", name: null, position: "SF", team_abrev: "BOS", league: "nba", type: "player", key_stat: "27.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4065648.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "p14", first_name: "Kawhi", last_name: "Leonard", name: null, position: "SF", team_abrev: "LAC", league: "nba", type: "player", key_stat: "23.8 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6450.png&w=350&h=254", game: { time: "8:30 pm", id: "g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "p15", first_name: "Jimmy", last_name: "Butler", name: null, position: "SF", team_abrev: "MIA", league: "nba", type: "player", key_stat: "22.9 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6430.png&w=350&h=254", game: { time: "7:30 pm", id: "g2", title: "GSW vs MIA" }, sport: "nba" },
  { id: "p16", first_name: "Paul", last_name: "George", name: null, position: "SF", team_abrev: "PHI", league: "nba", type: "player", key_stat: "22.6 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4251.png&w=350&h=254", game: { time: "8:00 pm", id: "g4", title: "MIL vs PHI" }, sport: "nba" },

  // --- Rising Stars ---
  { id: "p17", first_name: "Anthony", last_name: "Edwards", name: null, position: "SG", team_abrev: "MIN", league: "nba", type: "player", key_stat: "25.4 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594268.png&w=350&h=254", game: { time: "8:00 pm", id: "g8", title: "MIN vs OKC" }, sport: "nba" },
  { id: "p18", first_name: "Shai", last_name: "Gilgeous-Alexander", name: null, position: "SG", team_abrev: "OKC", league: "nba", type: "player", key_stat: "31.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278073.png&w=350&h=254", game: { time: "8:00 pm", id: "g8", title: "MIN vs OKC" }, sport: "nba" },
  { id: "p19", first_name: "Ja", last_name: "Morant", name: null, position: "PG", team_abrev: "MEM", league: "nba", type: "player", key_stat: "25.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4279888.png&w=350&h=254", game: { time: "9:00 pm", id: "g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "p20", first_name: "Donovan", last_name: "Mitchell", name: null, position: "SG", team_abrev: "CLE", league: "nba", type: "player", key_stat: "24.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3908809.png&w=350&h=254", game: { time: "7:00 pm", id: "g7", title: "IND vs CLE" }, sport: "nba" },

  // --- Defenders ---
  { id: "p21", first_name: "Rudy", last_name: "Gobert", name: null, position: "C", team_abrev: "MIN", league: "nba", type: "player", key_stat: "2.1 BPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032976.png&w=350&h=254", game: { time: "8:00 pm", id: "g8", title: "MIN vs OKC" }, sport: "nba" },
  { id: "p22", first_name: "Jaren", last_name: "Jackson Jr.", name: null, position: "PF", team_abrev: "MEM", league: "nba", type: "player", key_stat: "1.6 BPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4277847.png&w=350&h=254", game: { time: "9:00 pm", id: "g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "p23", first_name: "Evan", last_name: "Mobley", name: null, position: "PF", team_abrev: "CLE", league: "nba", type: "player", key_stat: "1.5 BPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432166.png&w=350&h=254", game: { time: "7:00 pm", id: "g7", title: "IND vs CLE" }, sport: "nba" },
  { id: "p24", first_name: "Chet", last_name: "Holmgren", name: null, position: "PF", team_abrev: "OKC", league: "nba", type: "player", key_stat: "2.0 BPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4897054.png&w=350&h=254", game: { time: "8:00 pm", id: "g8", title: "MIN vs OKC" }, sport: "nba" },

  // --- Extra scorers (Western conf) ---
  { id: "p25", first_name: "Devin", last_name: "Booker", name: null, position: "SG", team_abrev: "PHX", league: "nba", type: "player", key_stat: "27.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136193.png&w=350&h=254", game: { time: "8:00 pm", id: "g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "p26", first_name: "De'Aaron", last_name: "Fox", name: null, position: "PG", team_abrev: "SAC", league: "nba", type: "player", key_stat: "25.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066259.png&w=350&h=254", game: { time: "9:00 pm", id: "g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "p27", first_name: "Kyrie", last_name: "Irving", name: null, position: "PG", team_abrev: "DAL", league: "nba", type: "player", key_stat: "25.6 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6442.png&w=350&h=254", game: { time: "8:30 pm", id: "g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "p28", first_name: "Karl-Anthony", last_name: "Towns", name: null, position: "C", team_abrev: "NYK", league: "nba", type: "player", key_stat: "22.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136195.png&w=350&h=254", game: { time: "7:00 pm", id: "g6", title: "ATL vs NYK" }, sport: "nba" },

  // --- Eastern conf extras ---
  { id: "p29", first_name: "Jalen", last_name: "Brunson", name: null, position: "PG", team_abrev: "NYK", league: "nba", type: "player", key_stat: "28.7 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3934672.png&w=350&h=254", game: { time: "7:00 pm", id: "g6", title: "ATL vs NYK" }, sport: "nba" },
  { id: "p30", first_name: "Damian", last_name: "Lillard", name: null, position: "PG", team_abrev: "MIL", league: "nba", type: "player", key_stat: "24.3 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6606.png&w=350&h=254", game: { time: "8:00 pm", id: "g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "p31", first_name: "Darius", last_name: "Garland", name: null, position: "PG", team_abrev: "CLE", league: "nba", type: "player", key_stat: "18.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395723.png&w=350&h=254", game: { time: "7:00 pm", id: "g7", title: "IND vs CLE" }, sport: "nba" },
  { id: "p32", first_name: "Pascal", last_name: "Siakam", name: null, position: "PF", team_abrev: "IND", league: "nba", type: "player", key_stat: "22.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3149673.png&w=350&h=254", game: { time: "7:00 pm", id: "g7", title: "IND vs CLE" }, sport: "nba" },

  // --- Deep roster fills ---
  { id: "p33", first_name: "Jaylen", last_name: "Brown", name: null, position: "SG", team_abrev: "BOS", league: "nba", type: "player", key_stat: "23.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3917376.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "p34", first_name: "Jamal", last_name: "Murray", name: null, position: "PG", team_abrev: "DEN", league: "nba", type: "player", key_stat: "21.2 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3936299.png&w=350&h=254", game: { time: "8:00 pm", id: "g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "p35", first_name: "Dejounte", last_name: "Murray", name: null, position: "PG", team_abrev: "ATL", league: "nba", type: "player", key_stat: "20.5 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3908845.png&w=350&h=254", game: { time: "7:00 pm", id: "g6", title: "ATL vs NYK" }, sport: "nba" },
  { id: "p36", first_name: "Khris", last_name: "Middleton", name: null, position: "SF", team_abrev: "MIL", league: "nba", type: "player", key_stat: "17.2 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6609.png&w=350&h=254", game: { time: "8:00 pm", id: "g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "p37", first_name: "Jrue", last_name: "Holiday", name: null, position: "PG", team_abrev: "BOS", league: "nba", type: "player", key_stat: "12.5 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6442.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "p38", first_name: "Domantas", last_name: "Sabonis", name: null, position: "C", team_abrev: "SAC", league: "nba", type: "player", key_stat: "13.1 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3155942.png&w=350&h=254", game: { time: "9:00 pm", id: "g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "p39", first_name: "Desmond", last_name: "Bane", name: null, position: "SG", team_abrev: "MEM", league: "nba", type: "player", key_stat: "23.7 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4397102.png&w=350&h=254", game: { time: "9:00 pm", id: "g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "p40", first_name: "Austin", last_name: "Reaves", name: null, position: "SG", team_abrev: "LAL", league: "nba", type: "player", key_stat: "15.9 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395724.png&w=350&h=254", game: { time: "7:00 pm", id: "g1", title: "LAL vs BOS" }, sport: "nba" },
];

// ---------------------------------------------------------------------------
// Slate definitions — each one pulls specific players from the pool
// ---------------------------------------------------------------------------

interface SlateDefinition {
  name: string;
  description: string;
  game_count: number;
  max_entries: number;
  entry_count: number;
  hoursFromNow: number;
  entry_cost: number;
  payout: number;
  tiers: { question: string; key_stat: string; playerIds: string[] }[];
}

const SLATE_DEFS: SlateDefinition[] = [
  {
    name: "Tuesday Night Showdown",
    description: "The biggest stars on the court tonight — who will dominate?",
    game_count: 9,
    max_entries: 200,
    entry_count: 47,
    hoursFromNow: 2,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which superstar drops the most points?", key_stat: "PPG", playerIds: ["p1", "p2", "p4", "p18"] },
      { question: "Which big man grabs the most boards?", key_stat: "RPG", playerIds: ["p5", "p6", "p7", "p8"] },
      { question: "Which floor general dishes the most dimes?", key_stat: "APG", playerIds: ["p9", "p10", "p11", "p12"] },
      { question: "Which wing has the best all-around game?", key_stat: "PPG", playerIds: ["p13", "p14", "p15", "p16"] },
      { question: "Which young gun goes off?", key_stat: "PPG", playerIds: ["p17", "p19", "p20", "p25"] },
      { question: "Which shot-blocker anchors the paint?", key_stat: "BPG", playerIds: ["p21", "p22", "p23", "p24"] },
    ],
  },
  {
    name: "East vs West Battle",
    description: "Eastern Conference stars face off against Western Conference firepower.",
    game_count: 6,
    max_entries: 150,
    entry_count: 23,
    hoursFromNow: 3,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Top Eastern scorer?", key_stat: "PPG", playerIds: ["p4", "p7", "p29", "p20"] },
      { question: "Top Western scorer?", key_stat: "PPG", playerIds: ["p1", "p2", "p18", "p9"] },
      { question: "East playmaker supreme?", key_stat: "APG", playerIds: ["p10", "p11", "p31", "p30"] },
      { question: "West playmaker supreme?", key_stat: "APG", playerIds: ["p12", "p27", "p34", "p26"] },
      { question: "East paint presence?", key_stat: "RPG", playerIds: ["p7", "p23", "p28", "p32"] },
      { question: "West paint presence?", key_stat: "RPG", playerIds: ["p5", "p6", "p8", "p38"] },
    ],
  },
  {
    name: "Primetime Scorers",
    description: "Pure offense — pick the bucket-getters who light it up tonight.",
    game_count: 5,
    max_entries: 100,
    entry_count: 12,
    hoursFromNow: 1.5,
    entry_cost: 5,
    payout: 8,
    tiers: [
      { question: "Who leads all scorers tonight?", key_stat: "PPG", playerIds: ["p18", "p4", "p2", "p29"] },
      { question: "Best 2-guard performance?", key_stat: "PPG", playerIds: ["p17", "p20", "p25", "p33"] },
      { question: "Which point guard cooks?", key_stat: "PPG", playerIds: ["p27", "p9", "p30", "p26"] },
      { question: "Which forward fills the stat sheet?", key_stat: "PPG", playerIds: ["p3", "p13", "p16", "p32"] },
      { question: "Which center scores the most?", key_stat: "PPG", playerIds: ["p5", "p7", "p28", "p6"] },
      { question: "Breakout performance?", key_stat: "PPG", playerIds: ["p39", "p40", "p34", "p35"] },
    ],
  },
  {
    name: "Late Night Hoops",
    description: "West Coast action — the late games are always the wildest.",
    game_count: 4,
    max_entries: 100,
    entry_count: 8,
    hoursFromNow: 5,
    entry_cost: 5,
    payout: 8,
    tiers: [
      { question: "Who owns the late tip?", key_stat: "PPG", playerIds: ["p9", "p14", "p27", "p12"] },
      { question: "Which big dominates after dark?", key_stat: "RPG", playerIds: ["p5", "p38", "p21", "p6"] },
      { question: "Late night dime dropper?", key_stat: "APG", playerIds: ["p26", "p34", "p19", "p9"] },
      { question: "West Coast wing supremacy?", key_stat: "PPG", playerIds: ["p25", "p3", "p17", "p39"] },
      { question: "Who wins the rising star matchup?", key_stat: "PPG", playerIds: ["p18", "p19", "p26", "p17"] },
      { question: "Defensive Player of the Night?", key_stat: "BPG", playerIds: ["p21", "p24", "p22", "p38"] },
    ],
  },
  {
    name: "Rivalry Night Special",
    description: "Lakers-Celtics, Bucks-76ers, Mavs-Clippers — the rivalries that define the NBA.",
    game_count: 3,
    max_entries: 250,
    entry_count: 61,
    hoursFromNow: 2.5,
    entry_cost: 15,
    payout: 25,
    tiers: [
      { question: "Lakers vs Celtics — who shines?", key_stat: "PPG", playerIds: ["p1", "p6", "p13", "p33"] },
      { question: "Bucks vs 76ers — who balls out?", key_stat: "PPG", playerIds: ["p4", "p30", "p7", "p16"] },
      { question: "Mavs vs Clippers — top performer?", key_stat: "PPG", playerIds: ["p9", "p27", "p14", "p12"] },
      { question: "Best supporting cast performance?", key_stat: "PPG", playerIds: ["p37", "p40", "p36", "p15"] },
      { question: "Who grabs the most boards in rivalry games?", key_stat: "RPG", playerIds: ["p6", "p7", "p4", "p8"] },
      { question: "Assist king of rivalry night?", key_stat: "APG", playerIds: ["p1", "p30", "p27", "p37"] },
    ],
  },
  {
    name: "Next Gen Showcase",
    description: "The future is now — young stars battling for supremacy.",
    game_count: 7,
    max_entries: 120,
    entry_count: 15,
    hoursFromNow: 4,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which young scorer erupts?", key_stat: "PPG", playerIds: ["p18", "p17", "p29", "p19"] },
      { question: "Best sophomore / rising star?", key_stat: "PPG", playerIds: ["p24", "p39", "p20", "p25"] },
      { question: "Which young point guard takes over?", key_stat: "APG", playerIds: ["p11", "p31", "p26", "p35"] },
      { question: "Next gen big man battle?", key_stat: "RPG", playerIds: ["p23", "p24", "p8", "p38"] },
      { question: "Which two-way player dominates?", key_stat: "PPG", playerIds: ["p17", "p33", "p23", "p22"] },
      { question: "Who has the breakout moment?", key_stat: "PPG", playerIds: ["p40", "p34", "p32", "p39"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function buildPlayerMap(playerIds: string[]): Record<string, SlatePlayer> {
  const map: Record<string, SlatePlayer> = {};
  for (const id of playerIds) {
    const seed = ALL_PLAYERS.find((p) => p.id === id);
    if (!seed) continue;
    map[id] = { ...seed, score: 0, tie_breaker: 0 };
  }
  return map;
}

function buildSlateFromDef(def: SlateDefinition): {
  slate: Slate;
  meta: {
    name: string;
    sport: string;
    description: string;
    status: "open";
    start_time: string;
    entry_count: number;
    max_entries: number;
    game_count: number;
    created_at: string;
  };
} {
  const allPlayerIds = new Set<string>();
  const tiers: SlateTier[] = [];

  for (const tierDef of def.tiers) {
    for (const pid of tierDef.playerIds) allPlayerIds.add(pid);
    tiers.push({
      question: tierDef.question,
      key_stat: tierDef.key_stat,
      players: tierDef.playerIds,
      scoring_system: nbaScoringSystem,
      type: "nba",
    });
  }

  const players = buildPlayerMap([...allPlayerIds]);

  const now = new Date();
  const start = new Date(now);
  start.setMinutes(start.getMinutes() + Math.round(def.hoursFromNow * 60));
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
  };

  const meta = {
    name: def.name,
    sport: "nba",
    description: def.description,
    status: "open" as const,
    start_time: start.toISOString(),
    entry_count: def.entry_count,
    max_entries: def.max_entries,
    game_count: def.game_count,
    entry_cost: def.entry_cost,
    payout: def.payout,
    created_at: now.toISOString(),
  };

  return { slate, meta };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function deleteCollection(collectionPath: string) {
  const snapshot = await firestore.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`  ${collectionPath}: no documents to delete`);
    return;
  }
  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  ${collectionPath}: deleted ${snapshot.size} documents`);
}

async function main() {
  console.log("Clearing existing slates...");
  await deleteCollection(Collections.AVAILABLE_SLATES);
  await deleteCollection(Collections.SLATES);
  console.log("");

  const writes: Promise<FirebaseFirestore.WriteResult>[] = [];

  for (let i = 0; i < SLATE_DEFS.length; i++) {
    const def = SLATE_DEFS[i];
    const { slate, meta } = buildSlateFromDef(def);

    const docData = { ...slate, ...meta };

    writes.push(
      firestore
        .collection(Collections.AVAILABLE_SLATES)
        .doc(slate.id)
        .set(docData)
    );

    if (i === 0) {
      writes.push(
        firestore
          .collection(Collections.SLATES)
          .doc("current")
          .set(slate)
      );
    }

    console.log(`[${i + 1}/${SLATE_DEFS.length}] ${def.name}`);
    console.log(`    ID: ${slate.id}`);
    console.log(`    Starts in: ${def.hoursFromNow}h  |  Games: ${def.game_count}  |  Entries: ${def.entry_count}/${def.max_entries}`);
    console.log(`    Tiers: ${slate.tiers.length}`);
    for (let t = 0; t < slate.tiers.length; t++) {
      const tier = slate.tiers[t];
      const names = tier.players.map((pid) => {
        const p = slate.players[pid];
        return p ? `${p.first_name} ${p.last_name}` : pid;
      });
      console.log(`      R${t + 1}: ${tier.question}`);
      console.log(`          ${names.join(" | ")}`);
    }
    console.log("");
  }

  await Promise.all(writes);
  console.log(`Done — cleared old slates, wrote ${SLATE_DEFS.length} slates to AVAILABLE_SLATES + 1 to SLATES/current`);
}

main().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error creating mock slates:", e);
  process.exit(1);
});
