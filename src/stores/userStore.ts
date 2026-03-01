import { create } from 'zustand';
import { doc, getDoc, collection, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { searchUsers as searchUsersApi } from '../services/api';
import type { UserData, ContestArchive, PrizeData } from '../types';

interface UserState {
  user: UserData | null;
  userHistory: ContestArchive[];
  userPrizes: PrizeData[];
  searchResults: any[];

  fetchUser: (uid: string) => Promise<void>;
  fetchUserHistory: (uid: string) => Promise<void>;
  fetchUserPrizes: (uid: string) => Promise<void>;
  searchUsers: (displayName: string | null) => Promise<void>;
  setupUserListener: (uid: string) => () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  userHistory: [],
  userPrizes: [],
  searchResults: [],

  fetchUser: async (uid) => {
    const userRef = doc(firestore, 'USERS', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const userData = snap.data() as UserData;

    const recordsSnap = await getDocs(collection(firestore, 'USERS', uid, 'RECORDS'));
    const records: Record<string, any> = {};
    recordsSnap.docs.forEach((d) => {
      records[d.id] = { ...d.data(), id: d.id };
    });
    userData.records = records as any;
    set({ user: { ...userData, id: uid } });
  },

  fetchUserHistory: async (uid) => {
    try {
      const q = query(
        collection(firestore, 'USERS', uid, 'CONTEST_ARCHIVES'),
        orderBy('created_at', 'desc')
      );
      const snap = await getDocs(q);
      const archives = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as ContestArchive);
      set({ userHistory: archives });
    } catch (e) {
      console.warn('fetchUserHistory failed, falling back to unordered:', e);
      const snap = await getDocs(collection(firestore, 'USERS', uid, 'CONTEST_ARCHIVES'));
      const archives = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as ContestArchive);
      set({ userHistory: archives });
    }
  },

  fetchUserPrizes: async (uid) => {
    const snap = await getDocs(collection(firestore, 'USERS', uid, 'PRIZES'));
    set({ userPrizes: snap.docs.map((d) => d.data() as PrizeData) });
  },

  searchUsers: async (displayName) => {
    if (!displayName) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await searchUsersApi(displayName);
      set({ searchResults: results || [] });
    } catch {
      set({ searchResults: [] });
    }
  },

  setupUserListener: (uid) => {
    const userDocRef = doc(firestore, 'USERS', uid);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const userData = snap.data() as UserData;
        set({ user: { ...userData, id: uid } });
      }
    });

    return unsubscribe;
  },
}));
