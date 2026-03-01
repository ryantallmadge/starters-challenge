import { create } from 'zustand';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import type { LeaderboardEntry, LeaderboardState, TierWinEntry, AvatarMap } from '../types';

interface LeaderboardStoreState {
  leaderboard: LeaderboardEntry[];
  leaderboardState: LeaderboardState;
  currentPayout: string;
  tierWins: TierWinEntry[];
  avatars: AvatarMap;

  setupLeaderboardListeners: () => () => void;
  fetchCurrentPayout: () => Promise<void>;
  fetchAvatars: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardStoreState>((set) => ({
  leaderboard: [],
  leaderboardState: {},
  currentPayout: '',
  tierWins: [],
  avatars: {},

  setupLeaderboardListeners: () => {
    const unsubLeaderboard = onSnapshot(
      doc(firestore, 'LEADERBOARD', 'current'),
      (snap) => {
        const data = snap.data();
        set({ leaderboard: data?.entries ? Array.from(data.entries) : [] });
      },
      (error) => console.error('Leaderboard listener error:', error)
    );

    const unsubState = onSnapshot(
      doc(firestore, 'CONFIG', 'leaderboard_info'),
      (snap) => {
        set({ leaderboardState: snap.data() || {} });
      },
      (error) => console.error('Leaderboard state listener error:', error)
    );

    const unsubTierWins = onSnapshot(
      doc(firestore, 'USER_TIER_WINS', 'current'),
      (snap) => {
        const data = snap.data();
        set({ tierWins: data?.entries ? Array.from(data.entries) : [] });
      },
      (error) => console.error('Tier wins listener error:', error)
    );

    return () => {
      unsubLeaderboard();
      unsubState();
      unsubTierWins();
    };
  },

  fetchCurrentPayout: async () => {
    const snap = await getDoc(doc(firestore, 'CONFIG', 'current_prize'));
    const data = snap.data();
    set({ currentPayout: data?.value || '' });
  },

  fetchAvatars: async () => {
    const snap = await getDoc(doc(firestore, 'CONFIG', 'avatars'));
    set({ avatars: snap.data() || {} });
  },
}));
