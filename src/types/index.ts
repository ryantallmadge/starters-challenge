export interface UserData {
  id: string;
  display_name: string;
  email: string;
  avatar: string;
  avatar_picked: boolean;
  message_token?: string;
  coins?: number;
  record?: {
    wins: number;
    losses: number;
  };
  records?: Record<string, RecordEntry>;
  incoming_invites?: Record<string, InviteChallenge>;
  outgoing_invites?: Record<string, InviteChallenge>;
}

export interface RecordEntry {
  id: string;
  wins?: number;
  losses?: number;
}

export interface Contest {
  current?: CurrentContest;
  contests?: Record<string, CurrentContest>;
  none?: number;
  stage?: string;
  invite_challenges_in?: Record<string, InviteChallenge>;
  invite_challenges_out?: Record<string, InviteChallenge>;
}

export interface CurrentContest {
  id?: string;
  stage?: string;
  oppenent?: OpponentData & { picks?: string[] };
  chats?: ChatMessage[];
  draft?: DraftState;
  wager?: string;
  picks?: string[];
  slate?: SlateData;
  slate_id?: string;
  slate_name?: string;
  slate_start_time?: string;
  round?: number;
  pick?: number;
  user_turn?: boolean;
  completed?: boolean;
  token?: string;
}

export interface SlateData {
  players: Record<string, PlayerData>;
  tiers: TierData[];
}

export interface AvailableSlate {
  id: string;
  name: string;
  sport: string;
  description: string;
  status: 'open' | 'live' | 'completed';
  start_time: string;
  entry_count: number;
  max_entries: number;
  game_count: number;
  players: Record<string, PlayerData>;
  tiers: TierData[];
  created_at: string;
  entry_cost?: number;
  payout?: number;
  slate_type?: 'daily_free';
  single_entry?: boolean;
}

export interface OpponentData {
  id: string;
  display_name: string;
  avatar: string;
}

export interface InviteChallenge {
  id: string;
  display_name: string;
  avatar: string;
  wager?: string;
  slate_id?: string;
  slate_name?: string;
}

export interface DraftState {
  round: number;
  current_pick: number;
  on_the_clock: string;
  order: string[];
  token: string;
  next_pick_time: string;
  last_pick_time?: string;
  pick?: number;
  user_turn?: boolean;
  players?: Record<string, PlayerData>;
  tiers?: Record<string, TierData>;
  completed?: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  team?: string;
  team_abrev?: string;
  position?: string;
  thumbnail?: string;
  score?: number;
  key_stat?: number | string;
  picked?: boolean;
  type?: string;
  game?: { time: string; [key: string]: any };
}

export interface TierData {
  id: string;
  name: string;
  question?: string;
  players: string[];
  key_stat?: string;
  scoring_system?: Record<string, { name: string; score: string | number }>;
  type?: string;
}

export interface PickData {
  player: PlayerData;
  round: number;
  user_id: string;
  score?: number;
  won?: boolean;
  completed?: boolean;
}

export interface LeaderboardEntry {
  user: {
    id: string;
    display_name: string;
    avatar: string;
  };
  record?: {
    wins: number;
    losses: number;
  };
  tiers_won?: number;
}

export interface LeaderboardState {
  state?: 'weekly' | 'amazon';
  title?: string;
}

export interface ChatMessage {
  _id: string | number;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name?: string;
    avatar?: string;
  };
}

export interface ContestArchive {
  id?: string;
  created_at: { toDate?: () => Date };
  oppenent: OpponentData;
  user_won?: boolean;
  picks?: Record<string, PickData>;
  wager?: string;
  slate_name?: string;
  slate_id?: string;
  entry_cost?: number;
  payout?: number;
  tiers_won?: number;
  opponent_tiers_won?: number;
  sport?: string;
}

export interface PrizeData {
  id?: string;
  amount?: string;
  url?: string;
  redeemed?: boolean;
}

export interface AvatarMap {
  [key: string]: string;
}

export interface TierWinEntry {
  user: {
    id: string;
    display_name: string;
    avatar: string;
  };
  rounds?: boolean[];
}

export interface CoinLedgerEntry {
  id: string;
  type: 'entry_fee' | 'payout' | 'signup_bonus' | 'bonus';
  amount: number;
  balance_after: number;
  contest_id?: string;
  opponent_id?: string;
  created_at: string;
}
