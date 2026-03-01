import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import FullLoading from '../../src/components/FullLoading';
import AnimatedLogoGlow from '../../src/components/AnimatedLogoGlow';

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
      <View style={styles.content}>
        <AnimatedLogoGlow />

        <View style={{ height: 30 }} />

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

        <View style={{ height: 10 }} />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.grey}
          secureTextEntry
          returnKeyType="done"
          onChangeText={setPassword}
          value={password}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={{ height: 20 }} />

        <TouchableOpacity
          onPress={handleSignIn}
          style={[
            styles.signInButton,
            { backgroundColor: email && password ? Colors.primaryBlue : Colors.grey },
          ]}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <View style={styles.createAccountSection}>
          <Text style={styles.noAccountText}>Don't Have An Account?</Text>
          <View style={{ height: 10 }} />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={styles.createAccountButton}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
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
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    textAlign: 'left',
    color: Colors.black,
  },
  signInButton: {
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
  noAccountText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.arnoldSans,
    textTransform: 'uppercase',
  },
  createAccountSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: Colors.successGreenDark,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
});
