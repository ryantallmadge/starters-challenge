import { create } from 'zustand';
import { makePick } from '../services/api';

interface DraftStoreState {
  drafting: boolean;

  draftPlayer: (userId: string, pick: string, token: string, contestId?: string) => Promise<void>;
}

export const useDraftStore = create<DraftStoreState>((set) => ({
  drafting: false,

  draftPlayer: async (userId, pick, token, contestId) => {
    set({ drafting: true });
    try {
      await makePick(userId, pick, token, contestId);
    } finally {
      set({ drafting: false });
    }
  },
}));
