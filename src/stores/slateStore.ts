import { create } from 'zustand';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import type { AvailableSlate } from '../types';

interface SlateState {
  slates: AvailableSlate[];
  loading: boolean;
  setupSlateListener: () => () => void;
}

function filterActiveSlates(slates: AvailableSlate[]): AvailableSlate[] {
  const now = Date.now();
  return slates.filter((s) => new Date(s.start_time).getTime() > now);
}

export const useSlateStore = create<SlateState>((set, get) => {
  let expiryTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleNextExpiry() {
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = null;

    const now = Date.now();
    let earliest = Infinity;
    for (const s of get().slates) {
      const t = new Date(s.start_time).getTime();
      if (t > now && t < earliest) earliest = t;
    }

    if (earliest !== Infinity) {
      expiryTimer = setTimeout(() => {
        const active = filterActiveSlates(get().slates);
        set({ slates: active });
        scheduleNextExpiry();
      }, earliest - now + 500);
    }
  }

  return {
    slates: [],
    loading: true,

    setupSlateListener: () => {
      const q = query(
        collection(firestore, 'AVAILABLE_SLATES'),
        where('status', '==', 'open')
      );
      const unsub = onSnapshot(q, (snap) => {
        const raw = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as AvailableSlate[];

        const slates = filterActiveSlates(raw);
        slates.sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        set({ slates, loading: false });
        scheduleNextExpiry();
      });

      return () => {
        if (expiryTimer) clearTimeout(expiryTimer);
        expiryTimer = null;
        unsub();
      };
    },
  };
});
