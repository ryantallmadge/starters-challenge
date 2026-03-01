import React, { useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import FloatingAvatarMarquee from '../../src/components/FloatingAvatarMarquee';
import AuthInput from '../../src/components/AuthInput';
import GradientButton from '../../src/components/GradientButton';

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const error = useAuthStore((s) => s.error);
  const loading = useAuthStore((s) => s.loading);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!password) return;
    try {
      await signUp(displayName, email, password);
    } catch {
      // error is displayed via store state
    }
  };

  return (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.container}>
      <FloatingAvatarMarquee />

      {/* Decorative sport icons */}
      <View style={styles.sportIconsLayer} pointerEvents="none">
        <MaterialIcons name="sports-football" size={60} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', top: 70, right: 5 }} />
        <MaterialIcons name="sports-basketball" size={50} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', top: 130, left: -8 }} />
        <MaterialIcons name="sports-baseball" size={44} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', bottom: 140, right: 20 }} />
        <MaterialIcons name="sports-hockey" size={52} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', bottom: 60, left: 15 }} />
        <MaterialIcons name="emoji-events" size={40} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', top: 220, right: '40%' }} />
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
          JOIN THE DRAFT
        </Animated.Text>

        <View style={{ height: 28 }} />

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.fullWidth}>
          <AuthInput
            icon="person-outline"
            placeholder="Display Name"
            autoCapitalize="none"
            returnKeyType="done"
            onChangeText={setDisplayName}
            value={displayName}
          />
        </Animated.View>

        <View style={{ height: 12 }} />

        {displayName ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.fullWidth}>
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
        ) : null}

        {displayName ? <View style={{ height: 12 }} /> : null}

        {email ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.fullWidth}>
            <AuthInput
              icon="lock-outline"
              placeholder="Password"
              secureTextEntry
              returnKeyType="done"
              onChangeText={setPassword}
              value={password}
            />
          </Animated.View>
        ) : null}

        {error ? (
          <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
            {error}
          </Animated.Text>
        ) : null}

        <View style={{ height: 24 }} />

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.fullWidth}>
          <GradientButton
            label="Sign Up"
            onPress={handleSignUp}
            colors={['rgb(255,92,42)', 'rgb(255,193,0)']}
            disabled={!password}
            loading={loading}
          />
        </Animated.View>

        <View style={{ height: 20 }} />

        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.fullWidth}>
          <GradientButton
            label="Return To Sign In"
            onPress={() => router.back()}
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
});
