import { Alert } from 'react-native';
import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { joinPublicContest as joinPublicContestApi, sendInviteChallenge as sendInviteChallengeApi, updateInviteChallenge as updateInviteChallengeApi } from '../services/api';
import { useAuthStore } from './authStore';
import type { Contest, CurrentContest, AvailableSlate } from '../types';

interface ContestState {
  userContests: Contest | null;
  usersInContests: Record<string, any>;
  activeContestId: string | null;

  setupContestListeners: (uid: string) => () => void;
  setActiveContest: (id: string) => void;
  getContestsByStage: (stage: string) => [string, CurrentContest][];
  joinPublicContest: (userId: string, slateId?: string, slate?: AvailableSlate) => Promise<any>;
  sendInviteChallenge: (userId: string, opponentId: string, wager: string, slateId?: string, slateName?: string) => Promise<void>;
  updateInviteChallenge: (userId: string, opponentId: string, action: string) => Promise<void>;
}

export const useContestStore = create<ContestState>((set, get) => ({
  userContests: null,
  usersInContests: {},
  activeContestId: null,

  setupContestListeners: (uid) => {
    const unsubContest = onSnapshot(
      doc(firestore, 'USER_CONTESTS', uid),
      (snap) => {
        const data = snap.data();
        set({ userContests: data ? (data as Contest) : { none: 1 } as any });
      }
    );

    const unsubUsersInContest = onSnapshot(
      doc(firestore, 'USER_IN_CONTEST', 'state'),
      (snap) => {
        set({ usersInContests: snap.data() || {} });
      }
    );

    return () => {
      unsubContest();
      unsubUsersInContest();
    };
  },

  setActiveContest: (id) => {
    set({ activeContestId: id });
  },

  getContestsByStage: (stage) => {
    const { userContests } = get();
    if (!userContests) return [];

    const entries: [string, CurrentContest][] = [];

    if (userContests.contests) {
      for (const [id, contest] of Object.entries(userContests.contests)) {
        if (contest.stage === stage) entries.push([id, contest]);
      }
    }

    return entries;
  },

  joinPublicContest: async (userId, slateId, slate) => {
    if (slate?.entry_cost) {
      const userCoins = useAuthStore.getState().userData?.coins ?? 0;
      if (userCoins < slate.entry_cost) {
        Alert.alert(
          'Insufficient Coins',
          `You need ${slate.entry_cost} coins to enter this contest but only have ${userCoins}.`
        );
        return { noop: 'Insufficient coins' };
      }
    }

    const { data } = await joinPublicContestApi(userId, slateId);
    const result = data?.data ?? data;

    if (!result?.noop && !result?.error && result?.contest_id) {
      const current = get().userContests || {} as Contest;
      const contests = { ...(current.contests || {}) };
      if (result.added) {
        contests[result.contest_id] = {
          stage: 'pending',
          slate_id: slateId || null,
          slate: slate || null,
          slate_name: slate?.name || '',
        } as CurrentContest;
      }
      set({ userContests: { ...current, contests } as Contest });
    }

    return result;
  },

  sendInviteChallenge: async (userId, opponentId, wager, slateId, slateName) => {
    await sendInviteChallengeApi(userId, opponentId, wager, slateId, slateName);
  },

  updateInviteChallenge: async (userId, opponentId, action) => {
    await updateInviteChallengeApi(userId, opponentId, action);
  },
}));
