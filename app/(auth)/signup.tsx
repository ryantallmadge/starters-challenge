import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import AnimatedLogoGlow from '../../src/components/AnimatedLogoGlow';

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
      <View style={styles.content}>
        <AnimatedLogoGlow />

        <View style={{ height: 30 }} />

        <TextInput
          style={styles.input}
          placeholder="Please Enter A Display Name"
          placeholderTextColor={Colors.grey}
          autoCapitalize="none"
          returnKeyType="done"
          onChangeText={setDisplayName}
          value={displayName}
        />

        <View style={{ height: 10 }} />

        {displayName ? (
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.grey}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onChangeText={setEmail}
            value={email}
          />
        ) : null}

        <View style={{ height: 10 }} />

        {email ? (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.grey}
            secureTextEntry
            returnKeyType="done"
            onChangeText={setPassword}
            value={password}
          />
        ) : null}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={{ height: 20 }} />

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={!password || loading}
          style={[
            styles.signUpButton,
            { backgroundColor: password && !loading ? Colors.primaryBlue : Colors.grey },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.returnButton}
        >
          <Text style={styles.buttonText}>Return To Sign In</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  content: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: 'left',
    color: Colors.black,
  },
  signUpButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.vanguardBold,
    textTransform: 'uppercase',
    color: Colors.white,
  },
  errorText: {
    color: Colors.white,
    backgroundColor: 'rgba(255,59,48,0.8)',
    width: '100%',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: FontSizes.md,
    fontFamily: Fonts.robotoCondensedRegular,
    overflow: 'hidden',
  },
  returnButton: {
    width: '100%',
    backgroundColor: Colors.successGreenDark,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});
