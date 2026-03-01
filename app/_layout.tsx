import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialized, loading, needsUpgrade, needsAvatar, init } = useAuthStore();

  const [fontsLoaded] = useFonts({
    'VanguardCF-Bold': require('../assets/fonts/VanguardCF-Bold.otf'),
    'VanguardCF-ExtraBold': require('../assets/fonts/VanguardCF-ExtraBold.otf'),
    'VanguardCF-Medium': require('../assets/fonts/VanguardCF-Medium.otf'),
    'VanguardCF-Regular': require('../assets/fonts/VanguardCF-Regular.otf'),
    'VanguardCF-DemiBold': require('../assets/fonts/VanguardCF-DemiBold.otf'),
    'VanguardCF-Heavy': require('../assets/fonts/VanguardCF-Heavy.otf'),
    'VanguardCF-Light': require('../assets/fonts/VanguardCF-Light.otf'),
    'VanguardCF-Thin': require('../assets/fonts/VanguardCF-Thin.otf'),
    'RobotoCondensed-Bold': require('../assets/fonts/RobotoCondensed-Bold.ttf'),
    'RobotoCondensed-Regular': require('../assets/fonts/RobotoCondensed-Regular.ttf'),
    'Arnoldsans-Regular': require('../assets/fonts/Arnold Sans.otf'),
  });

  useEffect(() => {
    const unsubscribe = init();
    const timeout = setTimeout(() => {
      const { initialized } = useAuthStore.getState();
      if (!initialized) {
        useAuthStore.setState({ initialized: true, loading: false });
      }
    }, 5000);
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && initialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initialized]);

  useEffect(() => {
    if (!initialized || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (needsUpgrade) {
      router.replace('/(auth)/upgrade');
    } else if (needsAvatar) {
      router.replace('/(auth)/pick-avatar');
    } else {
      if (inAuthGroup) {
        router.replace('/(app)/(tabs)');
      }
    }
  }, [user, initialized, fontsLoaded, needsUpgrade, needsAvatar, segments]);

  if (!fontsLoaded || !initialized) {
    return null;
  }

  return <Slot />;
}
