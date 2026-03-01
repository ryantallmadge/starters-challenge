import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useContestStore } from '../../src/stores/contestStore';
import { useLeaderboardStore } from '../../src/stores/leaderboardStore';
import { useUserStore } from '../../src/stores/userStore';
import { useSlateStore } from '../../src/stores/slateStore';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const setupContestListeners = useContestStore((s) => s.setupContestListeners);
  const setupLeaderboardListeners = useLeaderboardStore((s) => s.setupLeaderboardListeners);
  const fetchAvatars = useLeaderboardStore((s) => s.fetchAvatars);
  const fetchCurrentPayout = useLeaderboardStore((s) => s.fetchCurrentPayout);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const setupUserListener = useUserStore((s) => s.setupUserListener);
  const setupSlateListener = useSlateStore((s) => s.setupSlateListener);

  useEffect(() => {
    if (!user) return;

    const cleanups: (() => void)[] = [];
    cleanups.push(setupContestListeners(user.uid));
    cleanups.push(setupLeaderboardListeners());
    cleanups.push(setupUserListener(user.uid));
    cleanups.push(setupSlateListener());
    fetchAvatars();
    fetchCurrentPayout();
    fetchUser(user.uid);

    return () => cleanups.forEach((fn) => fn());
  }, [user?.uid]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="live-scoring" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="draft" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="compare-teams" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="coin-ledger" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="challenge" options={{ headerShown: false }} />
    </Stack>
  );
}
