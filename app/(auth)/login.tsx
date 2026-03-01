import React, { useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import FullLoading from '../../src/components/FullLoading';
import FloatingAvatarMarquee from '../../src/components/FloatingAvatarMarquee';
import AuthInput from '../../src/components/AuthInput';
import GradientButton from '../../src/components/GradientButton';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (loading) return <FullLoading />;

  return (
    <LinearGradient colors={['rgb(11,152,93)', 'rgb(75,242,172)']} style={styles.container}>
      <FloatingAvatarMarquee />

      {/* Decorative sport icons */}
      <View style={styles.sportIconsLayer} pointerEvents="none">
        <MaterialIcons name="sports-basketball" size={64} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', top: 60, left: -10 }} />
        <MaterialIcons name="sports-football" size={52} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', top: 100, right: 10 }} />
        <MaterialIcons name="sports-baseball" size={48} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', bottom: 120, left: 20 }} />
        <MaterialIcons name="sports-hockey" size={56} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', bottom: 80, right: -5 }} />
        <MaterialIcons name="emoji-events" size={44} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', top: 200, left: '45%' }} />
      </View>

      <View style={styles.content}>
        <Image
          source={require('../../assets/images/starterslogo.png')}
          style={styles.logo}
        />

        <Animated.Text
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.tagline}
        >
          DRAFT. COMPETE. WIN.
        </Animated.Text>

        <View style={{ height: 28 }} />

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.fullWidth}>
          <AuthInput
            icon="mail-outline"
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onChangeText={setEmail}
            value={email}
          />
        </Animated.View>

        <View style={{ height: 12 }} />

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.fullWidth}>
          <AuthInput
            icon="lock-outline"
            placeholder="Password"
            secureTextEntry
            returnKeyType="done"
            onChangeText={setPassword}
            value={password}
          />
        </Animated.View>

        {error ? (
          <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
            {error}
          </Animated.Text>
        ) : null}

        <View style={{ height: 24 }} />

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.fullWidth}>
          <GradientButton
            label="Sign In"
            onPress={handleSignIn}
            colors={['rgb(255,92,42)', 'rgb(255,193,0)']}
            disabled={!email || !password}
          />
        </Animated.View>

        <View style={{ height: 24 }} />

        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.createAccountSection}>
          <Text style={styles.noAccountText}>Don't Have An Account?</Text>
          <View style={{ height: 12 }} />
          <GradientButton
            label="Create Account"
            onPress={() => router.push('/(auth)/signup')}
            colors={['rgb(11,152,93)', 'rgb(5,208,123)']}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sportIconsLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  logo: {
    width: 220,
    height: 170,
    resizeMode: 'contain',
  },
  tagline: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.title,
    color: Colors.white,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  fullWidth: {
    width: '100%',
  },
  errorText: {
    color: Colors.white,
    backgroundColor: 'rgba(255,59,48,0.85)',
    width: '100%',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: FontSizes.md,
    fontFamily: Fonts.robotoCondensedRegular,
    overflow: 'hidden',
    marginTop: 12,
  },
  noAccountText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.arnoldSans,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  createAccountSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
