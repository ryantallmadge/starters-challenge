import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { createUser as createUserApi } from '../services/api';
import type { UserData } from '../types';

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  needsUpgrade: boolean;
  needsAvatar: boolean;

  init: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  saveAvatar: (avatar: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const SUPPORTED_VERSIONS = [1];

async function upsertFirestoreUser(uid: string, data: Partial<UserData>) {
  const userRef = doc(firestore, 'USERS', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { ...data, id: uid });
  } else {
    await setDoc(userRef, { ...data, id: uid });
  }
  const updated = await getDoc(userRef);
  return updated.data() as UserData;
}

let unsubUserDoc: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, getState) => ({
  user: null,
  userData: null,
  loading: true,
  error: null,
  initialized: false,
  needsUpgrade: false,
  needsAvatar: false,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (!user) {
        set({ user: null, userData: null, loading: false, initialized: true, needsUpgrade: false, needsAvatar: false });
        return;
      }

      try {
        const versionSnap = await getDoc(doc(firestore, 'CONFIG', 'version'));
        const versionData = versionSnap.data();
        if (versionData && !SUPPORTED_VERSIONS.includes(versionData.value)) {
          set({ user, loading: false, initialized: true, needsUpgrade: true });
          return;
        }

        const updateData: Record<string, string> = {};
        if (user.email) updateData.email = user.email;
        if (user.displayName) updateData.display_name = user.displayName;

        const userData = await upsertFirestoreUser(user.uid, updateData);
        const needsAvatar = !userData.avatar_picked;

        set({
          user,
          userData,
          loading: false,
          initialized: true,
          needsUpgrade: false,
          needsAvatar,
        });

        unsubUserDoc = onSnapshot(doc(firestore, 'USERS', user.uid), (snap) => {
          if (snap.exists()) {
            set({ userData: snap.data() as UserData });
          }
        });
      } catch {
        set({ user, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
    } catch (e: any) {
      const msg = e.message || '';
      let error = msg;
      if (msg.includes('invalid-email')) error = 'Invalid Email Address';
      else if (msg.includes('user-not-found')) error = 'Could not find email';
      else if (msg.includes('wrong-password')) error = 'Could not verify email/password';
      set({ loading: false, error });
      throw new Error(error);
    }
  },

  signUp: async (displayName, email, password) => {
    const trimmed = displayName.trim();
    if (!trimmed) return;

    set({ loading: true, error: null });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      await updateProfile(user, { displayName: trimmed });
      await upsertFirestoreUser(user.uid, {
        display_name: trimmed,
        avatar: 'Coach',
        email,
      } as Partial<UserData>);
      try {
        await createUserApi(trimmed, email, user.uid);
      } catch {
        console.warn('createUserApi failed (non-critical)');
      }
      set({ loading: false });
    } catch (e: any) {
      set({ loading: false, error: e.message });
      throw e;
    }
  },

  logout: () => {
    if (unsubUserDoc) {
      unsubUserDoc();
      unsubUserDoc = null;
    }
    signOut(auth);
    set({ user: null, userData: null, initialized: true, needsAvatar: false, needsUpgrade: false });
  },

  saveAvatar: async (avatar: string) => {
    const { user } = getState();
    if (!user) return;
    const userData = await upsertFirestoreUser(user.uid, { avatar, avatar_picked: true } as Partial<UserData>);
    set({ userData, needsAvatar: false });
  },

  refreshUserData: async () => {
    const { user } = getState();
    if (!user) return;
    const userRef = doc(firestore, 'USERS', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      set({ userData: snap.data() as UserData });
    }
  },
}));
