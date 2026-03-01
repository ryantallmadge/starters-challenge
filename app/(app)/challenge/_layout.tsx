import { Stack } from 'expo-router';

export default function ChallengeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="choose" />
      <Stack.Screen name="select" />
      <Stack.Screen name="wager" />
    </Stack>
  );
}
