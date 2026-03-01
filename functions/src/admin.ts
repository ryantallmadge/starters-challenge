import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

initializeApp();

export const firestore = getFirestore();
export const messaging = getMessaging();
export const auth = getAuth();

export const Collections = {
  SLATES: "SLATES",
  AVAILABLE_SLATES: "AVAILABLE_SLATES",
  USER_CONTESTS: "USER_CONTESTS",
  USER_IN_CONTEST: "USER_IN_CONTEST",
  ACTIVE_DRAFTS: "ACTIVE_DRAFTS",
  LEADERBOARD: "LEADERBOARD",
  USER_TIER_WINS: "USER_TIER_WINS",
  CONFIG: "CONFIG",
  USERS: "USERS",
  PUBLIC_LOBBY: "PUBLIC_LOBBY",
  HEADSHOTS: "HEADSHOTS",
  ARCHIVE_SLATES: "ARCHIVE_SLATES",
  TIER_WINS: "TIER_WINS",
  COIN_LEDGER: "COIN_LEDGER",
} as const;
