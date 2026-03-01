/**
 * Create mock slates across multiple sports (NBA, NFL, NHL, MLB, NCAAFB)
 * in AVAILABLE_SLATES and one in SLATES/current for backward compatibility.
 *
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 npx ts-node --esm src/scripts/createMockBasketballSlate.ts
 */
import { v4 as uuidv4 } from "uuid";
import { firestore, Collections } from "../admin.js";
import { scoringSystems } from "../challenge/lib/scoringSystems.js";
import type { SlatePlayer, SlateTier, Slate, ScoringSystem } from "../types.js";

type SportKey = "nba" | "nfl" | "nhl" | "mlb" | "ncaafb";

type PlayerSeed = Omit<SlatePlayer, "score" | "tie_breaker" | "picked" | "scored" | "stats">;

// ---------------------------------------------------------------------------
// Player pools — organised by sport
// ---------------------------------------------------------------------------

const NBA_PLAYERS: PlayerSeed[] = [
  { id: "nba1", first_name: "LeBron", last_name: "James", name: null, position: "SF", team_abrev: "LAL", league: "nba", type: "player", key_stat: "27.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "nba2", first_name: "Stephen", last_name: "Curry", name: null, position: "PG", team_abrev: "GSW", league: "nba", type: "player", key_stat: "29.4 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png&w=350&h=254", game: { time: "7:30 pm", id: "nba-g2", title: "GSW vs MIA" }, sport: "nba" },
  { id: "nba3", first_name: "Kevin", last_name: "Durant", name: null, position: "SF", team_abrev: "PHX", league: "nba", type: "player", key_stat: "27.9 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3202.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "nba4", first_name: "Giannis", last_name: "Antetokounmpo", name: null, position: "PF", team_abrev: "MIL", league: "nba", type: "player", key_stat: "31.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032977.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "nba5", first_name: "Nikola", last_name: "Jokic", name: null, position: "C", team_abrev: "DEN", league: "nba", type: "player", key_stat: "12.4 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3112335.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "nba6", first_name: "Anthony", last_name: "Davis", name: null, position: "C", team_abrev: "LAL", league: "nba", type: "player", key_stat: "12.1 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6583.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "nba7", first_name: "Joel", last_name: "Embiid", name: null, position: "C", team_abrev: "PHI", league: "nba", type: "player", key_stat: "11.0 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3059318.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "nba8", first_name: "Luka", last_name: "Doncic", name: null, position: "PG", team_abrev: "DAL", league: "nba", type: "player", key_stat: "9.8 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395725.png&w=350&h=254", game: { time: "8:30 pm", id: "nba-g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "nba9", first_name: "Trae", last_name: "Young", name: null, position: "PG", team_abrev: "ATL", league: "nba", type: "player", key_stat: "10.8 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4277905.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g6", title: "ATL vs NYK" }, sport: "nba" },
  { id: "nba10", first_name: "Jayson", last_name: "Tatum", name: null, position: "SF", team_abrev: "BOS", league: "nba", type: "player", key_stat: "27.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4065648.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "nba11", first_name: "Shai", last_name: "Gilgeous-Alexander", name: null, position: "SG", team_abrev: "OKC", league: "nba", type: "player", key_stat: "31.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278073.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g7", title: "MIN vs OKC" }, sport: "nba" },
  { id: "nba12", first_name: "Anthony", last_name: "Edwards", name: null, position: "SG", team_abrev: "MIN", league: "nba", type: "player", key_stat: "25.4 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594268.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g7", title: "MIN vs OKC" }, sport: "nba" },
  { id: "nba13", first_name: "Donovan", last_name: "Mitchell", name: null, position: "SG", team_abrev: "CLE", league: "nba", type: "player", key_stat: "24.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3908809.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g8", title: "IND vs CLE" }, sport: "nba" },
  { id: "nba14", first_name: "Jalen", last_name: "Brunson", name: null, position: "PG", team_abrev: "NYK", league: "nba", type: "player", key_stat: "28.7 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3934672.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g6", title: "ATL vs NYK" }, sport: "nba" },
  { id: "nba15", first_name: "Damian", last_name: "Lillard", name: null, position: "PG", team_abrev: "MIL", league: "nba", type: "player", key_stat: "24.3 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6606.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g4", title: "MIL vs PHI" }, sport: "nba" },
  { id: "nba16", first_name: "Jaylen", last_name: "Brown", name: null, position: "SG", team_abrev: "BOS", league: "nba", type: "player", key_stat: "23.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3917376.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g1", title: "LAL vs BOS" }, sport: "nba" },
  { id: "nba17", first_name: "Jimmy", last_name: "Butler", name: null, position: "SF", team_abrev: "MIA", league: "nba", type: "player", key_stat: "22.9 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6430.png&w=350&h=254", game: { time: "7:30 pm", id: "nba-g2", title: "GSW vs MIA" }, sport: "nba" },
  { id: "nba18", first_name: "Bam", last_name: "Adebayo", name: null, position: "C", team_abrev: "MIA", league: "nba", type: "player", key_stat: "10.4 RPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066261.png&w=350&h=254", game: { time: "7:30 pm", id: "nba-g2", title: "GSW vs MIA" }, sport: "nba" },
  { id: "nba19", first_name: "Kyrie", last_name: "Irving", name: null, position: "PG", team_abrev: "DAL", league: "nba", type: "player", key_stat: "25.6 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6442.png&w=350&h=254", game: { time: "8:30 pm", id: "nba-g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "nba20", first_name: "Devin", last_name: "Booker", name: null, position: "SG", team_abrev: "PHX", league: "nba", type: "player", key_stat: "27.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136193.png&w=350&h=254", game: { time: "8:00 pm", id: "nba-g3", title: "PHX vs DEN" }, sport: "nba" },
  { id: "nba21", first_name: "Kawhi", last_name: "Leonard", name: null, position: "SF", team_abrev: "LAC", league: "nba", type: "player", key_stat: "23.8 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6450.png&w=350&h=254", game: { time: "8:30 pm", id: "nba-g5", title: "DAL vs LAC" }, sport: "nba" },
  { id: "nba22", first_name: "Tyrese", last_name: "Haliburton", name: null, position: "PG", team_abrev: "IND", league: "nba", type: "player", key_stat: "10.4 APG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4397002.png&w=350&h=254", game: { time: "7:00 pm", id: "nba-g8", title: "IND vs CLE" }, sport: "nba" },
  { id: "nba23", first_name: "Ja", last_name: "Morant", name: null, position: "PG", team_abrev: "MEM", league: "nba", type: "player", key_stat: "25.1 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4279888.png&w=350&h=254", game: { time: "9:00 pm", id: "nba-g9", title: "MEM vs SAC" }, sport: "nba" },
  { id: "nba24", first_name: "De'Aaron", last_name: "Fox", name: null, position: "PG", team_abrev: "SAC", league: "nba", type: "player", key_stat: "25.0 PPG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066259.png&w=350&h=254", game: { time: "9:00 pm", id: "nba-g9", title: "MEM vs SAC" }, sport: "nba" },
];

const NFL_PLAYERS: PlayerSeed[] = [
  { id: "nfl1", first_name: "Patrick", last_name: "Mahomes", name: null, position: "QB", team_abrev: "KC", league: "nfl", type: "player", key_stat: "4,839 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3139477.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g1", title: "KC vs BUF" }, sport: "nfl" },
  { id: "nfl2", first_name: "Josh", last_name: "Allen", name: null, position: "QB", team_abrev: "BUF", league: "nfl", type: "player", key_stat: "4,306 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3918298.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g1", title: "KC vs BUF" }, sport: "nfl" },
  { id: "nfl3", first_name: "Lamar", last_name: "Jackson", name: null, position: "QB", team_abrev: "BAL", league: "nfl", type: "player", key_stat: "3,678 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3916387.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g2", title: "BAL vs CIN" }, sport: "nfl" },
  { id: "nfl4", first_name: "Joe", last_name: "Burrow", name: null, position: "QB", team_abrev: "CIN", league: "nfl", type: "player", key_stat: "4,475 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3915511.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g2", title: "BAL vs CIN" }, sport: "nfl" },
  { id: "nfl5", first_name: "Tyreek", last_name: "Hill", name: null, position: "WR", team_abrev: "MIA", league: "nfl", type: "player", key_stat: "1,799 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3116406.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g3", title: "MIA vs NYJ" }, sport: "nfl" },
  { id: "nfl6", first_name: "Ja'Marr", last_name: "Chase", name: null, position: "WR", team_abrev: "CIN", league: "nfl", type: "player", key_stat: "1,216 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4362628.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g2", title: "BAL vs CIN" }, sport: "nfl" },
  { id: "nfl7", first_name: "CeeDee", last_name: "Lamb", name: null, position: "WR", team_abrev: "DAL", league: "nfl", type: "player", key_stat: "1,749 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241389.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g4", title: "DAL vs PHI" }, sport: "nfl" },
  { id: "nfl8", first_name: "A.J.", last_name: "Brown", name: null, position: "WR", team_abrev: "PHI", league: "nfl", type: "player", key_stat: "1,456 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4047650.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g4", title: "DAL vs PHI" }, sport: "nfl" },
  { id: "nfl9", first_name: "Christian", last_name: "McCaffrey", name: null, position: "RB", team_abrev: "SF", league: "nfl", type: "player", key_stat: "1,459 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3117251.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g5", title: "SF vs SEA" }, sport: "nfl" },
  { id: "nfl10", first_name: "Derrick", last_name: "Henry", name: null, position: "RB", team_abrev: "BAL", league: "nfl", type: "player", key_stat: "1,167 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3043078.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g2", title: "BAL vs CIN" }, sport: "nfl" },
  { id: "nfl11", first_name: "Travis", last_name: "Kelce", name: null, position: "TE", team_abrev: "KC", league: "nfl", type: "player", key_stat: "984 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15847.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g1", title: "KC vs BUF" }, sport: "nfl" },
  { id: "nfl12", first_name: "Jalen", last_name: "Hurts", name: null, position: "QB", team_abrev: "PHI", league: "nfl", type: "player", key_stat: "3,858 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4040715.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g4", title: "DAL vs PHI" }, sport: "nfl" },
  { id: "nfl13", first_name: "Brock", last_name: "Purdy", name: null, position: "QB", team_abrev: "SF", league: "nfl", type: "player", key_stat: "4,280 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4432577.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g5", title: "SF vs SEA" }, sport: "nfl" },
  { id: "nfl14", first_name: "Saquon", last_name: "Barkley", name: null, position: "RB", team_abrev: "PHI", league: "nfl", type: "player", key_stat: "1,312 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3929630.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g4", title: "DAL vs PHI" }, sport: "nfl" },
  { id: "nfl15", first_name: "Stefon", last_name: "Diggs", name: null, position: "WR", team_abrev: "BUF", league: "nfl", type: "player", key_stat: "1,183 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2976212.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g1", title: "KC vs BUF" }, sport: "nfl" },
  { id: "nfl16", first_name: "T.J.", last_name: "Watt", name: null, position: "LB", team_abrev: "PIT", league: "nfl", type: "player", key_stat: "19 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3046779.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g6", title: "PIT vs CLE" }, sport: "nfl" },
  { id: "nfl17", first_name: "Micah", last_name: "Parsons", name: null, position: "LB", team_abrev: "DAL", league: "nfl", type: "player", key_stat: "14 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4567048.png&w=350&h=254", game: { time: "4:25 pm", id: "nfl-g4", title: "DAL vs PHI" }, sport: "nfl" },
  { id: "nfl18", first_name: "Nick", last_name: "Bosa", name: null, position: "DE", team_abrev: "SF", league: "nfl", type: "player", key_stat: "12.5 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3916434.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g5", title: "SF vs SEA" }, sport: "nfl" },
  { id: "nfl19", first_name: "DK", last_name: "Metcalf", name: null, position: "WR", team_abrev: "SEA", league: "nfl", type: "player", key_stat: "1,114 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4047650.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g5", title: "SF vs SEA" }, sport: "nfl" },
  { id: "nfl20", first_name: "Davante", last_name: "Adams", name: null, position: "WR", team_abrev: "LV", league: "nfl", type: "player", key_stat: "1,144 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/16800.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g7", title: "LV vs DEN" }, sport: "nfl" },
  { id: "nfl21", first_name: "Breece", last_name: "Hall", name: null, position: "RB", team_abrev: "NYJ", league: "nfl", type: "player", key_stat: "994 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4430027.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g3", title: "MIA vs NYJ" }, sport: "nfl" },
  { id: "nfl22", first_name: "Tua", last_name: "Tagovailoa", name: null, position: "QB", team_abrev: "MIA", league: "nfl", type: "player", key_stat: "4,624 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241479.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g3", title: "MIA vs NYJ" }, sport: "nfl" },
  { id: "nfl23", first_name: "George", last_name: "Kittle", name: null, position: "TE", team_abrev: "SF", league: "nfl", type: "player", key_stat: "1,020 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3040151.png&w=350&h=254", game: { time: "4:05 pm", id: "nfl-g5", title: "SF vs SEA" }, sport: "nfl" },
  { id: "nfl24", first_name: "Amon-Ra", last_name: "St. Brown", name: null, position: "WR", team_abrev: "DET", league: "nfl", type: "player", key_stat: "1,515 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4360438.png&w=350&h=254", game: { time: "1:00 pm", id: "nfl-g8", title: "DET vs GB" }, sport: "nfl" },
];

const NHL_PLAYERS: PlayerSeed[] = [
  { id: "nhl1", first_name: "Connor", last_name: "McDavid", name: null, position: "C", team_abrev: "EDM", league: "nhl", type: "player", key_stat: "64 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3895074.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g1", title: "EDM vs CGY" }, sport: "nhl" },
  { id: "nhl2", first_name: "Nathan", last_name: "MacKinnon", name: null, position: "C", team_abrev: "COL", league: "nhl", type: "player", key_stat: "51 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041969.png&w=350&h=254", game: { time: "9:00 pm", id: "nhl-g2", title: "COL vs VGK" }, sport: "nhl" },
  { id: "nhl3", first_name: "Auston", last_name: "Matthews", name: null, position: "C", team_abrev: "TOR", league: "nhl", type: "player", key_stat: "69 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024123.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g3", title: "TOR vs MTL" }, sport: "nhl" },
  { id: "nhl4", first_name: "Leon", last_name: "Draisaitl", name: null, position: "C", team_abrev: "EDM", league: "nhl", type: "player", key_stat: "52 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114727.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g1", title: "EDM vs CGY" }, sport: "nhl" },
  { id: "nhl5", first_name: "Nikita", last_name: "Kucherov", name: null, position: "RW", team_abrev: "TBL", league: "nhl", type: "player", key_stat: "44 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041964.png&w=350&h=254", game: { time: "7:30 pm", id: "nhl-g4", title: "TBL vs FLA" }, sport: "nhl" },
  { id: "nhl6", first_name: "David", last_name: "Pastrnak", name: null, position: "RW", team_abrev: "BOS", league: "nhl", type: "player", key_stat: "47 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3899937.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g5", title: "BOS vs NYR" }, sport: "nhl" },
  { id: "nhl7", first_name: "Cale", last_name: "Makar", name: null, position: "D", team_abrev: "COL", league: "nhl", type: "player", key_stat: "21 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4352768.png&w=350&h=254", game: { time: "9:00 pm", id: "nhl-g2", title: "COL vs VGK" }, sport: "nhl" },
  { id: "nhl8", first_name: "Igor", last_name: "Shesterkin", name: null, position: "G", team_abrev: "NYR", league: "nhl", type: "player", key_stat: ".926 SV%", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233623.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g5", title: "BOS vs NYR" }, sport: "nhl" },
  { id: "nhl9", first_name: "Artemi", last_name: "Panarin", name: null, position: "LW", team_abrev: "NYR", league: "nhl", type: "player", key_stat: "49 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3899963.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g5", title: "BOS vs NYR" }, sport: "nhl" },
  { id: "nhl10", first_name: "Aleksander", last_name: "Barkov", name: null, position: "C", team_abrev: "FLA", league: "nhl", type: "player", key_stat: "39 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041970.png&w=350&h=254", game: { time: "7:30 pm", id: "nhl-g4", title: "TBL vs FLA" }, sport: "nhl" },
  { id: "nhl11", first_name: "Matthew", last_name: "Tkachuk", name: null, position: "LW", team_abrev: "FLA", league: "nhl", type: "player", key_stat: "40 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024105.png&w=350&h=254", game: { time: "7:30 pm", id: "nhl-g4", title: "TBL vs FLA" }, sport: "nhl" },
  { id: "nhl12", first_name: "Jack", last_name: "Hughes", name: null, position: "C", team_abrev: "NJD", league: "nhl", type: "player", key_stat: "43 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4565222.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g6", title: "NJD vs CAR" }, sport: "nhl" },
  { id: "nhl13", first_name: "Sebastian", last_name: "Aho", name: null, position: "C", team_abrev: "CAR", league: "nhl", type: "player", key_stat: "37 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024099.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g6", title: "NJD vs CAR" }, sport: "nhl" },
  { id: "nhl14", first_name: "Mitch", last_name: "Marner", name: null, position: "RW", team_abrev: "TOR", league: "nhl", type: "player", key_stat: "85 A", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024093.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g3", title: "TOR vs MTL" }, sport: "nhl" },
  { id: "nhl15", first_name: "Connor", last_name: "Hellebuyck", name: null, position: "G", team_abrev: "WPG", league: "nhl", type: "player", key_stat: ".921 SV%", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3899959.png&w=350&h=254", game: { time: "8:00 pm", id: "nhl-g7", title: "WPG vs MIN" }, sport: "nhl" },
  { id: "nhl16", first_name: "Kirill", last_name: "Kaprizov", name: null, position: "LW", team_abrev: "MIN", league: "nhl", type: "player", key_stat: "46 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233710.png&w=350&h=254", game: { time: "8:00 pm", id: "nhl-g7", title: "WPG vs MIN" }, sport: "nhl" },
  { id: "nhl17", first_name: "Sidney", last_name: "Crosby", name: null, position: "C", team_abrev: "PIT", league: "nhl", type: "player", key_stat: "33 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g8", title: "PIT vs WSH" }, sport: "nhl" },
  { id: "nhl18", first_name: "Alex", last_name: "Ovechkin", name: null, position: "LW", team_abrev: "WSH", league: "nhl", type: "player", key_stat: "31 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3101.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g8", title: "PIT vs WSH" }, sport: "nhl" },
  { id: "nhl19", first_name: "Victor", last_name: "Hedman", name: null, position: "D", team_abrev: "TBL", league: "nhl", type: "player", key_stat: "14 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/5025.png&w=350&h=254", game: { time: "7:30 pm", id: "nhl-g4", title: "TBL vs FLA" }, sport: "nhl" },
  { id: "nhl20", first_name: "Andrei", last_name: "Vasilevskiy", name: null, position: "G", team_abrev: "TBL", league: "nhl", type: "player", key_stat: ".915 SV%", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3899957.png&w=350&h=254", game: { time: "7:30 pm", id: "nhl-g4", title: "TBL vs FLA" }, sport: "nhl" },
  { id: "nhl21", first_name: "Mikko", last_name: "Rantanen", name: null, position: "RW", team_abrev: "COL", league: "nhl", type: "player", key_stat: "42 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3899942.png&w=350&h=254", game: { time: "9:00 pm", id: "nhl-g2", title: "COL vs VGK" }, sport: "nhl" },
  { id: "nhl22", first_name: "Brady", last_name: "Tkachuk", name: null, position: "LW", team_abrev: "OTT", league: "nhl", type: "player", key_stat: "37 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4352758.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g9", title: "OTT vs DET" }, sport: "nhl" },
  { id: "nhl23", first_name: "Tim", last_name: "Stutzle", name: null, position: "C", team_abrev: "OTT", league: "nhl", type: "player", key_stat: "30 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4697396.png&w=350&h=254", game: { time: "7:00 pm", id: "nhl-g9", title: "OTT vs DET" }, sport: "nhl" },
  { id: "nhl24", first_name: "Jason", last_name: "Robertson", name: null, position: "LW", team_abrev: "DAL", league: "nhl", type: "player", key_stat: "39 G", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4565227.png&w=350&h=254", game: { time: "8:30 pm", id: "nhl-g10", title: "DAL vs STL" }, sport: "nhl" },
];

const MLB_PLAYERS: PlayerSeed[] = [
  { id: "mlb1", first_name: "Shohei", last_name: "Ohtani", name: null, position: "DH", team_abrev: "LAD", league: "mlb", type: "player", key_stat: ".304 AVG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39832.png&w=350&h=254", game: { time: "7:10 pm", id: "mlb-g1", title: "LAD vs SF" }, sport: "mlb" },
  { id: "mlb2", first_name: "Aaron", last_name: "Judge", name: null, position: "OF", team_abrev: "NYY", league: "mlb", type: "player", key_stat: "37 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33192.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g2", title: "NYY vs BOS" }, sport: "mlb" },
  { id: "mlb3", first_name: "Mookie", last_name: "Betts", name: null, position: "SS", team_abrev: "LAD", league: "mlb", type: "player", key_stat: ".307 AVG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33039.png&w=350&h=254", game: { time: "7:10 pm", id: "mlb-g1", title: "LAD vs SF" }, sport: "mlb" },
  { id: "mlb4", first_name: "Ronald", last_name: "Acuña Jr.", name: null, position: "OF", team_abrev: "ATL", league: "mlb", type: "player", key_stat: "41 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36185.png&w=350&h=254", game: { time: "7:20 pm", id: "mlb-g3", title: "ATL vs NYM" }, sport: "mlb" },
  { id: "mlb5", first_name: "Freddie", last_name: "Freeman", name: null, position: "1B", team_abrev: "LAD", league: "mlb", type: "player", key_stat: ".331 AVG", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30193.png&w=350&h=254", game: { time: "7:10 pm", id: "mlb-g1", title: "LAD vs SF" }, sport: "mlb" },
  { id: "mlb6", first_name: "Corey", last_name: "Seager", name: null, position: "SS", team_abrev: "TEX", league: "mlb", type: "player", key_stat: "33 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32691.png&w=350&h=254", game: { time: "8:05 pm", id: "mlb-g4", title: "TEX vs HOU" }, sport: "mlb" },
  { id: "mlb7", first_name: "Gerrit", last_name: "Cole", name: null, position: "SP", team_abrev: "NYY", league: "mlb", type: "player", key_stat: "2.63 ERA", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/31092.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g2", title: "NYY vs BOS" }, sport: "mlb" },
  { id: "mlb8", first_name: "Spencer", last_name: "Strider", name: null, position: "SP", team_abrev: "ATL", league: "mlb", type: "player", key_stat: "281 K", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40389.png&w=350&h=254", game: { time: "7:20 pm", id: "mlb-g3", title: "ATL vs NYM" }, sport: "mlb" },
  { id: "mlb9", first_name: "Juan", last_name: "Soto", name: null, position: "OF", team_abrev: "NYY", league: "mlb", type: "player", key_stat: "35 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40180.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g2", title: "NYY vs BOS" }, sport: "mlb" },
  { id: "mlb10", first_name: "Yordan", last_name: "Alvarez", name: null, position: "DH", team_abrev: "HOU", league: "mlb", type: "player", key_stat: "31 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36767.png&w=350&h=254", game: { time: "8:05 pm", id: "mlb-g4", title: "TEX vs HOU" }, sport: "mlb" },
  { id: "mlb11", first_name: "Trea", last_name: "Turner", name: null, position: "SS", team_abrev: "PHI", league: "mlb", type: "player", key_stat: "26 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32159.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g5", title: "PHI vs MIL" }, sport: "mlb" },
  { id: "mlb12", first_name: "Corbin", last_name: "Burnes", name: null, position: "SP", team_abrev: "BAL", league: "mlb", type: "player", key_stat: "2.98 ERA", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/35984.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g6", title: "BAL vs TB" }, sport: "mlb" },
  { id: "mlb13", first_name: "Rafael", last_name: "Devers", name: null, position: "3B", team_abrev: "BOS", league: "mlb", type: "player", key_stat: "33 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36890.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g2", title: "NYY vs BOS" }, sport: "mlb" },
  { id: "mlb14", first_name: "Matt", last_name: "Olson", name: null, position: "1B", team_abrev: "ATL", league: "mlb", type: "player", key_stat: "54 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/34951.png&w=350&h=254", game: { time: "7:20 pm", id: "mlb-g3", title: "ATL vs NYM" }, sport: "mlb" },
  { id: "mlb15", first_name: "Kyle", last_name: "Tucker", name: null, position: "OF", team_abrev: "HOU", league: "mlb", type: "player", key_stat: "29 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36946.png&w=350&h=254", game: { time: "8:05 pm", id: "mlb-g4", title: "TEX vs HOU" }, sport: "mlb" },
  { id: "mlb16", first_name: "Zack", last_name: "Wheeler", name: null, position: "SP", team_abrev: "PHI", league: "mlb", type: "player", key_stat: "3.07 ERA", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/31261.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g5", title: "PHI vs MIL" }, sport: "mlb" },
  { id: "mlb17", first_name: "Bryce", last_name: "Harper", name: null, position: "1B", team_abrev: "PHI", league: "mlb", type: "player", key_stat: "30 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30951.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g5", title: "PHI vs MIL" }, sport: "mlb" },
  { id: "mlb18", first_name: "Marcus", last_name: "Semien", name: null, position: "2B", team_abrev: "TEX", league: "mlb", type: "player", key_stat: "25 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32657.png&w=350&h=254", game: { time: "8:05 pm", id: "mlb-g4", title: "TEX vs HOU" }, sport: "mlb" },
  { id: "mlb19", first_name: "Julio", last_name: "Rodriguez", name: null, position: "OF", team_abrev: "SEA", league: "mlb", type: "player", key_stat: "32 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42428.png&w=350&h=254", game: { time: "10:10 pm", id: "mlb-g7", title: "SEA vs OAK" }, sport: "mlb" },
  { id: "mlb20", first_name: "Fernando", last_name: "Tatis Jr.", name: null, position: "OF", team_abrev: "SD", league: "mlb", type: "player", key_stat: "31 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40830.png&w=350&h=254", game: { time: "9:40 pm", id: "mlb-g8", title: "SD vs ARI" }, sport: "mlb" },
  { id: "mlb21", first_name: "Pete", last_name: "Alonso", name: null, position: "1B", team_abrev: "NYM", league: "mlb", type: "player", key_stat: "46 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/38560.png&w=350&h=254", game: { time: "7:20 pm", id: "mlb-g3", title: "ATL vs NYM" }, sport: "mlb" },
  { id: "mlb22", first_name: "Gunnar", last_name: "Henderson", name: null, position: "SS", team_abrev: "BAL", league: "mlb", type: "player", key_stat: "28 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42466.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g6", title: "BAL vs TB" }, sport: "mlb" },
  { id: "mlb23", first_name: "Adley", last_name: "Rutschman", name: null, position: "C", team_abrev: "BAL", league: "mlb", type: "player", key_stat: "20 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42449.png&w=350&h=254", game: { time: "7:05 pm", id: "mlb-g6", title: "BAL vs TB" }, sport: "mlb" },
  { id: "mlb24", first_name: "Bo", last_name: "Bichette", name: null, position: "SS", team_abrev: "TOR", league: "mlb", type: "player", key_stat: "20 HR", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/40394.png&w=350&h=254", game: { time: "7:07 pm", id: "mlb-g9", title: "TOR vs MIN" }, sport: "mlb" },
];

const NCAAFB_PLAYERS: PlayerSeed[] = [
  { id: "ncaa1", first_name: "Caleb", last_name: "Williams", name: null, position: "QB", team_abrev: "USC", league: "ncaafb", type: "player", key_stat: "3,633 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4432762.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g1", title: "USC vs UCLA" }, sport: "ncaafb" },
  { id: "ncaa2", first_name: "Jayden", last_name: "Daniels", name: null, position: "QB", team_abrev: "LSU", league: "ncaafb", type: "player", key_stat: "3,812 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4426348.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g2", title: "LSU vs ALA" }, sport: "ncaafb" },
  { id: "ncaa3", first_name: "Bo", last_name: "Nix", name: null, position: "QB", team_abrev: "ORE", league: "ncaafb", type: "player", key_stat: "4,145 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4361370.png&w=350&h=254", game: { time: "7:30 pm", id: "ncaa-g3", title: "ORE vs WSU" }, sport: "ncaafb" },
  { id: "ncaa4", first_name: "Michael", last_name: "Penix Jr.", name: null, position: "QB", team_abrev: "UW", league: "ncaafb", type: "player", key_stat: "4,218 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4430519.png&w=350&h=254", game: { time: "7:00 pm", id: "ncaa-g4", title: "UW vs OSU" }, sport: "ncaafb" },
  { id: "ncaa5", first_name: "Marvin", last_name: "Harrison Jr.", name: null, position: "WR", team_abrev: "OSU", league: "ncaafb", type: "player", key_stat: "1,211 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567156.png&w=350&h=254", game: { time: "7:00 pm", id: "ncaa-g4", title: "UW vs OSU" }, sport: "ncaafb" },
  { id: "ncaa6", first_name: "Rome", last_name: "Odunze", name: null, position: "WR", team_abrev: "UW", league: "ncaafb", type: "player", key_stat: "1,145 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4569610.png&w=350&h=254", game: { time: "7:00 pm", id: "ncaa-g4", title: "UW vs OSU" }, sport: "ncaafb" },
  { id: "ncaa7", first_name: "Ollie", last_name: "Gordon II", name: null, position: "RB", team_abrev: "OKST", league: "ncaafb", type: "player", key_stat: "1,732 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567210.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g5", title: "OKST vs UT" }, sport: "ncaafb" },
  { id: "ncaa8", first_name: "TreVeyon", last_name: "Henderson", name: null, position: "RB", team_abrev: "OSU", league: "ncaafb", type: "player", key_stat: "1,026 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567048.png&w=350&h=254", game: { time: "7:00 pm", id: "ncaa-g4", title: "UW vs OSU" }, sport: "ncaafb" },
  { id: "ncaa9", first_name: "Travis", last_name: "Etienne Jr.", name: null, position: "RB", team_abrev: "UGA", league: "ncaafb", type: "player", key_stat: "1,340 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4361260.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g6", title: "UGA vs FLA" }, sport: "ncaafb" },
  { id: "ncaa10", first_name: "Carson", last_name: "Beck", name: null, position: "QB", team_abrev: "UGA", league: "ncaafb", type: "player", key_stat: "3,941 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567201.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g6", title: "UGA vs FLA" }, sport: "ncaafb" },
  { id: "ncaa11", first_name: "Jalen", last_name: "Milroe", name: null, position: "QB", team_abrev: "ALA", league: "ncaafb", type: "player", key_stat: "2,834 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4430471.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g2", title: "LSU vs ALA" }, sport: "ncaafb" },
  { id: "ncaa12", first_name: "Malik", last_name: "Nabers", name: null, position: "WR", team_abrev: "LSU", league: "ncaafb", type: "player", key_stat: "1,569 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4569600.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g2", title: "LSU vs ALA" }, sport: "ncaafb" },
  { id: "ncaa13", first_name: "Quinn", last_name: "Ewers", name: null, position: "QB", team_abrev: "UT", league: "ncaafb", type: "player", key_stat: "3,479 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4683048.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g5", title: "OKST vs UT" }, sport: "ncaafb" },
  { id: "ncaa14", first_name: "Brock", last_name: "Bowers", name: null, position: "TE", team_abrev: "UGA", league: "ncaafb", type: "player", key_stat: "56 REC", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567207.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g6", title: "UGA vs FLA" }, sport: "ncaafb" },
  { id: "ncaa15", first_name: "Dallas", last_name: "Turner", name: null, position: "LB", team_abrev: "ALA", league: "ncaafb", type: "player", key_stat: "10 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567049.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g2", title: "LSU vs ALA" }, sport: "ncaafb" },
  { id: "ncaa16", first_name: "Tahj", last_name: "Brooks", name: null, position: "RB", team_abrev: "TTU", league: "ncaafb", type: "player", key_stat: "1,538 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4570497.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g7", title: "TTU vs BU" }, sport: "ncaafb" },
  { id: "ncaa17", first_name: "Drake", last_name: "Maye", name: null, position: "QB", team_abrev: "UNC", league: "ncaafb", type: "player", key_stat: "3,608 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4683048.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g8", title: "UNC vs NCST" }, sport: "ncaafb" },
  { id: "ncaa18", first_name: "JJ", last_name: "McCarthy", name: null, position: "QB", team_abrev: "MICH", league: "ncaafb", type: "player", key_stat: "2,991 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567204.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g9", title: "MICH vs MSU" }, sport: "ncaafb" },
  { id: "ncaa19", first_name: "Blake", last_name: "Corum", name: null, position: "RB", team_abrev: "MICH", league: "ncaafb", type: "player", key_stat: "1,463 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567203.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g9", title: "MICH vs MSU" }, sport: "ncaafb" },
  { id: "ncaa20", first_name: "Travis", last_name: "Hunter", name: null, position: "WR", team_abrev: "CU", league: "ncaafb", type: "player", key_stat: "1,152 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4871714.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g10", title: "CU vs AZ" }, sport: "ncaafb" },
  { id: "ncaa21", first_name: "Ladd", last_name: "McConkey", name: null, position: "WR", team_abrev: "UGA", league: "ncaafb", type: "player", key_stat: "907 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4567205.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g6", title: "UGA vs FLA" }, sport: "ncaafb" },
  { id: "ncaa22", first_name: "Donovan", last_name: "Edwards", name: null, position: "RB", team_abrev: "MICH", league: "ncaafb", type: "player", key_stat: "1,216 YDS", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4569612.png&w=350&h=254", game: { time: "12:00 pm", id: "ncaa-g9", title: "MICH vs MSU" }, sport: "ncaafb" },
  { id: "ncaa23", first_name: "Jared", last_name: "Verse", name: null, position: "DE", team_abrev: "FSU", league: "ncaafb", type: "player", key_stat: "9 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4871721.png&w=350&h=254", game: { time: "7:30 pm", id: "ncaa-g11", title: "FSU vs MIA" }, sport: "ncaafb" },
  { id: "ncaa24", first_name: "Laiatu", last_name: "Latu", name: null, position: "DE", team_abrev: "UCLA", league: "ncaafb", type: "player", key_stat: "8 SACK", thumbnail: "https://a.espncdn.com/combiner/i?img=/i/headshots/college-football/players/full/4682228.png&w=350&h=254", game: { time: "3:30 pm", id: "ncaa-g1", title: "USC vs UCLA" }, sport: "ncaafb" },
];

const ALL_PLAYERS: PlayerSeed[] = [
  ...NBA_PLAYERS,
  ...NFL_PLAYERS,
  ...NHL_PLAYERS,
  ...MLB_PLAYERS,
  ...NCAAFB_PLAYERS,
];

// ---------------------------------------------------------------------------
// Slate definitions — each one references a sport and pulls from that pool
// ---------------------------------------------------------------------------

interface SlateDefinition {
  name: string;
  sport: SportKey;
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
  // ── NBA ──────────────────────────────────────────────────────────────────
  {
    name: "Tuesday Night Showdown",
    sport: "nba",
    description: "The biggest stars on the court tonight — who will dominate?",
    game_count: 9,
    max_entries: 200,
    entry_count: 47,
    hoursFromNow: 2,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which superstar drops the most points?", key_stat: "PPG", playerIds: ["nba1", "nba2", "nba4", "nba11"] },
      { question: "Which big man grabs the most boards?", key_stat: "RPG", playerIds: ["nba5", "nba6", "nba7", "nba18"] },
      { question: "Which floor general dishes the most dimes?", key_stat: "APG", playerIds: ["nba8", "nba9", "nba22", "nba15"] },
      { question: "Which wing has the best all-around game?", key_stat: "PPG", playerIds: ["nba10", "nba21", "nba17", "nba3"] },
      { question: "Which young gun goes off?", key_stat: "PPG", playerIds: ["nba12", "nba23", "nba13", "nba20"] },
      { question: "Who wins the point guard showdown?", key_stat: "PPG", playerIds: ["nba14", "nba19", "nba24", "nba16"] },
    ],
  },
  {
    name: "Primetime Scorers",
    sport: "nba",
    description: "Pure offense — pick the bucket-getters who light it up tonight.",
    game_count: 5,
    max_entries: 100,
    entry_count: 12,
    hoursFromNow: 1.5,
    entry_cost: 5,
    payout: 8,
    tiers: [
      { question: "Who leads all scorers tonight?", key_stat: "PPG", playerIds: ["nba11", "nba4", "nba2", "nba14"] },
      { question: "Best 2-guard performance?", key_stat: "PPG", playerIds: ["nba12", "nba13", "nba20", "nba16"] },
      { question: "Which point guard cooks?", key_stat: "PPG", playerIds: ["nba19", "nba8", "nba15", "nba24"] },
      { question: "Which forward fills the stat sheet?", key_stat: "PPG", playerIds: ["nba3", "nba10", "nba21", "nba17"] },
      { question: "Which center scores the most?", key_stat: "PPG", playerIds: ["nba5", "nba7", "nba6", "nba18"] },
      { question: "Breakout performance?", key_stat: "PPG", playerIds: ["nba23", "nba22", "nba1", "nba9"] },
    ],
  },

  // ── NFL ──────────────────────────────────────────────────────────────────
  {
    name: "Sunday Gridiron Clash",
    sport: "nfl",
    description: "The full NFL Sunday slate — pick the players who dominate.",
    game_count: 8,
    max_entries: 300,
    entry_count: 89,
    hoursFromNow: 3,
    entry_cost: 15,
    payout: 25,
    tiers: [
      { question: "Which QB throws for the most yards?", key_stat: "Pass YDS", playerIds: ["nfl1", "nfl2", "nfl3", "nfl4"] },
      { question: "Which WR has the biggest day?", key_stat: "Rec YDS", playerIds: ["nfl5", "nfl6", "nfl7", "nfl8"] },
      { question: "Which RB runs wild?", key_stat: "Rush YDS", playerIds: ["nfl9", "nfl10", "nfl14", "nfl21"] },
      { question: "Which QB-WR stack goes off?", key_stat: "Pass YDS", playerIds: ["nfl12", "nfl13", "nfl22", "nfl19"] },
      { question: "Which pass catcher dominates?", key_stat: "Rec YDS", playerIds: ["nfl11", "nfl23", "nfl15", "nfl24"] },
      { question: "Which defender wrecks the game plan?", key_stat: "SACK", playerIds: ["nfl16", "nfl17", "nfl18", "nfl20"] },
    ],
  },
  {
    name: "Primetime AFC Showdown",
    sport: "nfl",
    description: "Bills vs Chiefs, Ravens vs Bengals — the AFC's best collide.",
    game_count: 4,
    max_entries: 200,
    entry_count: 55,
    hoursFromNow: 4,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Mahomes or Allen — who balls out?", key_stat: "Pass YDS", playerIds: ["nfl1", "nfl2", "nfl3", "nfl4"] },
      { question: "Which RB controls the ground game?", key_stat: "Rush YDS", playerIds: ["nfl10", "nfl14", "nfl9", "nfl21"] },
      { question: "Which wideout torches the secondary?", key_stat: "Rec YDS", playerIds: ["nfl5", "nfl6", "nfl15", "nfl19"] },
      { question: "Which tight end steals the show?", key_stat: "Rec YDS", playerIds: ["nfl11", "nfl23", "nfl20", "nfl24"] },
      { question: "Which pass rusher gets home?", key_stat: "SACK", playerIds: ["nfl16", "nfl17", "nfl18", "nfl8"] },
      { question: "Best fantasy QB performance?", key_stat: "Pass TD", playerIds: ["nfl22", "nfl12", "nfl13", "nfl7"] },
    ],
  },

  // ── NHL ──────────────────────────────────────────────────────────────────
  {
    name: "Hockey Night Showdown",
    sport: "nhl",
    description: "The best skaters on the ice — who lights the lamp the most?",
    game_count: 7,
    max_entries: 150,
    entry_count: 34,
    hoursFromNow: 2.5,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which center pots the most goals?", key_stat: "Goals", playerIds: ["nhl1", "nhl2", "nhl3", "nhl12"] },
      { question: "Which winger lights the lamp?", key_stat: "Goals", playerIds: ["nhl5", "nhl6", "nhl9", "nhl16"] },
      { question: "Which playmaker racks up assists?", key_stat: "Assists", playerIds: ["nhl4", "nhl14", "nhl10", "nhl11"] },
      { question: "Which defenseman or goalie steals the game?", key_stat: "Goals", playerIds: ["nhl7", "nhl19", "nhl13", "nhl21"] },
      { question: "Which goalie stands on his head?", key_stat: "Saves", playerIds: ["nhl8", "nhl15", "nhl20", "nhl17"] },
      { question: "Which skater piles up shots?", key_stat: "SOG", playerIds: ["nhl18", "nhl22", "nhl23", "nhl24"] },
    ],
  },
  {
    name: "Original Six Rivalry Night",
    sport: "nhl",
    description: "Bruins-Rangers, Leafs-Habs — hockey's fiercest rivalries.",
    game_count: 3,
    max_entries: 120,
    entry_count: 28,
    hoursFromNow: 3.5,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Who scores first — Leafs or Habs?", key_stat: "Goals", playerIds: ["nhl3", "nhl14", "nhl17", "nhl23"] },
      { question: "Bruins or Rangers — top scorer?", key_stat: "Goals", playerIds: ["nhl6", "nhl9", "nhl18", "nhl22"] },
      { question: "Which star center dominates?", key_stat: "Goals", playerIds: ["nhl1", "nhl2", "nhl10", "nhl12"] },
      { question: "Which winger has the best night?", key_stat: "Goals", playerIds: ["nhl5", "nhl11", "nhl16", "nhl24"] },
      { question: "Which Oiler or Av goes off?", key_stat: "Goals", playerIds: ["nhl4", "nhl7", "nhl19", "nhl21"] },
      { question: "Which goalie stands tall?", key_stat: "Saves", playerIds: ["nhl8", "nhl15", "nhl20", "nhl13"] },
    ],
  },

  // ── MLB ──────────────────────────────────────────────────────────────────
  {
    name: "Midsummer Slugfest",
    sport: "mlb",
    description: "The long ball is alive — pick the sluggers who go yard tonight.",
    game_count: 6,
    max_entries: 180,
    entry_count: 41,
    hoursFromNow: 2,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which slugger goes deep?", key_stat: "HR", playerIds: ["mlb1", "mlb2", "mlb4", "mlb14"] },
      { question: "Which hitter has the most hits?", key_stat: "AVG", playerIds: ["mlb3", "mlb5", "mlb6", "mlb11"] },
      { question: "Which pitcher dominates on the mound?", key_stat: "K", playerIds: ["mlb7", "mlb8", "mlb12", "mlb16"] },
      { question: "Which outfielder drives in the most runs?", key_stat: "RBI", playerIds: ["mlb9", "mlb15", "mlb17", "mlb21"] },
      { question: "Which infielder has the best day at the plate?", key_stat: "Hits", playerIds: ["mlb10", "mlb13", "mlb18", "mlb22"] },
      { question: "Which young bat breaks out?", key_stat: "HR", playerIds: ["mlb19", "mlb20", "mlb23", "mlb24"] },
    ],
  },
  {
    name: "Rivalry Series Special",
    sport: "mlb",
    description: "Yankees-Red Sox, Dodgers-Giants, Braves-Mets — baseball's best rivalries.",
    game_count: 4,
    max_entries: 200,
    entry_count: 52,
    hoursFromNow: 3.5,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Yankees vs Red Sox — MVP?", key_stat: "HR", playerIds: ["mlb2", "mlb9", "mlb13", "mlb23"] },
      { question: "Dodgers vs Giants — top hitter?", key_stat: "Hits", playerIds: ["mlb1", "mlb3", "mlb5", "mlb19"] },
      { question: "Braves vs Mets — who carries the offense?", key_stat: "RBI", playerIds: ["mlb4", "mlb14", "mlb21", "mlb22"] },
      { question: "Best pitcher in a rivalry game?", key_stat: "K", playerIds: ["mlb7", "mlb8", "mlb12", "mlb16"] },
      { question: "Which slugger launches one?", key_stat: "HR", playerIds: ["mlb10", "mlb15", "mlb6", "mlb18"] },
      { question: "Best all-around offensive performance?", key_stat: "Hits", playerIds: ["mlb11", "mlb17", "mlb20", "mlb24"] },
    ],
  },

  // ── NCAAFB ───────────────────────────────────────────────────────────────
  {
    name: "College Football Saturday",
    sport: "ncaafb",
    description: "The biggest games on the board — Heisman contenders clash.",
    game_count: 7,
    max_entries: 250,
    entry_count: 67,
    hoursFromNow: 1,
    entry_cost: 10,
    payout: 18,
    tiers: [
      { question: "Which Heisman hopeful goes off?", key_stat: "Pass YDS", playerIds: ["ncaa1", "ncaa2", "ncaa3", "ncaa4"] },
      { question: "Which RB runs wild?", key_stat: "Rush YDS", playerIds: ["ncaa7", "ncaa8", "ncaa19", "ncaa22"] },
      { question: "Which WR dominates?", key_stat: "Rec YDS", playerIds: ["ncaa5", "ncaa6", "ncaa12", "ncaa20"] },
      { question: "Which QB throws the most TDs?", key_stat: "Pass TD", playerIds: ["ncaa10", "ncaa11", "ncaa17", "ncaa18"] },
      { question: "Which playmaker steals the show?", key_stat: "Total YDS", playerIds: ["ncaa9", "ncaa13", "ncaa14", "ncaa21"] },
      { question: "Which defender makes the biggest impact?", key_stat: "SACK", playerIds: ["ncaa15", "ncaa16", "ncaa23", "ncaa24"] },
    ],
  },
  {
    name: "SEC Showdown Saturday",
    sport: "ncaafb",
    description: "LSU vs Alabama, Georgia vs Florida — the SEC's marquee matchups.",
    game_count: 3,
    max_entries: 200,
    entry_count: 45,
    hoursFromNow: 2.5,
    entry_cost: 15,
    payout: 25,
    tiers: [
      { question: "LSU vs Bama — which QB wins the duel?", key_stat: "Pass YDS", playerIds: ["ncaa2", "ncaa11", "ncaa17", "ncaa18"] },
      { question: "Georgia vs Florida — offensive MVP?", key_stat: "Total YDS", playerIds: ["ncaa10", "ncaa9", "ncaa14", "ncaa21"] },
      { question: "Which receiver has the biggest game?", key_stat: "Rec YDS", playerIds: ["ncaa12", "ncaa5", "ncaa6", "ncaa20"] },
      { question: "Which rusher gashes the defense?", key_stat: "Rush YDS", playerIds: ["ncaa7", "ncaa8", "ncaa16", "ncaa22"] },
      { question: "Which SEC QB throws the most TDs?", key_stat: "Pass TD", playerIds: ["ncaa1", "ncaa3", "ncaa4", "ncaa13"] },
      { question: "Defensive player of the day?", key_stat: "SACK", playerIds: ["ncaa15", "ncaa19", "ncaa23", "ncaa24"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

const SPORT_SCORING: Record<SportKey, ScoringSystem> = {
  nba: scoringSystems.nba,
  nfl: scoringSystems.nfl,
  nhl: scoringSystems.nhl,
  mlb: scoringSystems.mlb,
  ncaafb: scoringSystems.ncaafb,
};

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
  const scoring = SPORT_SCORING[def.sport];

  for (const tierDef of def.tiers) {
    for (const pid of tierDef.playerIds) allPlayerIds.add(pid);
    tiers.push({
      question: tierDef.question,
      key_stat: tierDef.key_stat,
      players: tierDef.playerIds,
      scoring_system: scoring,
      type: def.sport,
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
    sport: def.sport,
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

    const sportLabel = def.sport.toUpperCase();
    console.log(`[${i + 1}/${SLATE_DEFS.length}] [${sportLabel}] ${def.name}`);
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
  console.log(`Done — cleared old slates, wrote ${SLATE_DEFS.length} slates across ${new Set(SLATE_DEFS.map((d) => d.sport)).size} sports to AVAILABLE_SLATES + 1 to SLATES/current`);
}

main().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error("Error creating mock slates:", e);
  process.exit(1);
});
