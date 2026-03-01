import { create } from 'zustand';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import type { AvailableSlate } from '../types';

interface SlateState {
  slates: AvailableSlate[];
  loading: boolean;
  setupSlateListener: () => () => void;
}

export const useSlateStore = create<SlateState>((set) => ({
  slates: [],
  loading: true,

  setupSlateListener: () => {
    const q = query(
      collection(firestore, 'AVAILABLE_SLATES'),
      where('status', '==', 'open')
    );
    const unsub = onSnapshot(q, (snap) => {
      const slates = snap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as AvailableSlate[];
      slates.sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      set({ slates, loading: false });
    });
    return unsub;
  },
}));
