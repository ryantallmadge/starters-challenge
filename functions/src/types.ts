export interface ScoringRule {
  name: string;
  score: number;
  key: string;
  value?: string;
}

export interface ScoringSystem {
  [statKey: string]: ScoringRule;
}

export interface ScoringSystemsBySport {
  [sport: string]: ScoringSystem;
}

export interface SlatePlayer {
  first_name?: string;
  last_name?: string;
  name?: string | null;
  game: {
    time: string;
    id: string;
    date?: string;
    title?: string;
    status?: string;
  };
  id: string;
  key_stat?: string | number;
  league: string;
  position: string;
  score: number;
  team_abrev: string;
  thumbnail?: string;
  tie_breaker: number;
  type: "player" | "team";
  picked?: number;
  scored?: boolean;
  stats?: ScoredPlayerResult;
  sort_stat?: number | string;
  sport?: string;
}

export interface SlateTier {
  key_stat?: string;
  players: string[];
  question?: string;
  scoring_system?: ScoringSystem;
  scoring_system_to_lable?: Record<string, string>;
  type: string;
  video?: string;
}

export interface Slate {
  id: string;
  start: string;
  end: string;
  players: Record<string, SlatePlayer>;
  tiers: SlateTier[];
  created_at?: string;
  updated?: string;
  type?: string;
  entry_cost?: number;
  payout?: number;
}

export interface DraftState {
  order: string[];
  round: number;
  on_the_clock: string;
  current_pick: number;
  token: string;
  last_pick_time: string;
  next_pick_time: string;
}

export interface Opponent {
  id: string;
  avatar?: string;
  display_name?: string;
  email?: string;
  message_token?: string | null;
  picks?: string[];
}

export interface Contest {
  slate: Slate;
  stage: "pending" | "draft" | "live";
  wager: string;
  created_at: string;
  type: "challenge" | "public";
  draft: DraftState;
  oppenent: Opponent;
  picks?: string[];
  chats?: ChatMessage[];
}

export interface UserContest {
  current: Contest | null;
}

export interface UserData {
  id: string;
  email?: string;
  display_name?: string;
  avatar?: string;
  message_token?: string;
  coins?: number;
  incoming_invites?: Record<string, InviteData>;
  outgoing_invites?: Record<string, InviteData>;
}

export interface CoinLedgerEntry {
  id: string;
  type: "entry_fee" | "payout" | "signup_bonus" | "bonus";
  amount: number;
  balance_after: number;
  contest_id?: string;
  opponent_id?: string;
  created_at: string;
}

export interface InviteData {
  display_name: string;
  avatar: string;
  wager: string;
  id: string;
  created_at: string;
}

export interface ChatMessage {
  _id: number;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export interface LeaderboardEntry {
  tiers_won: number;
  record: { wins: number; losses: number };
  games_count: number;
  record_count: number;
  win_percentage: number;
  user: {
    avatar: string;
    display_name: string;
    id: string;
  };
  sort_val: number;
}

export interface ScoredPlayerResult {
  scored_stats: Record<string, { value: number; points: number }>;
  total_points: number;
}

export interface SportRadarConfig {
  [sport: string]: {
    key: string;
    access_level: string;
    version?: string;
    photo_key?: string;
    YEAR?: string;
    WEEK?: string;
  };
}

export interface TierWinEntry {
  tiers_won: number;
  user: {
    avatar: string;
    id: string;
    display_name: string;
  };
}
