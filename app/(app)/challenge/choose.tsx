import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useContestStore } from '../../../src/stores/contestStore';
import { useAuthStore } from '../../../src/stores/authStore';

export default function ChallengeChooseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slateId?: string; slateName?: string }>();
  const authUser = useAuthStore((s) => s.user);
  const joinPublicContest = useContestStore((s) => s.joinPublicContest);
  const [loading, setLoading] = useState(false);

  const handleRandomOpponent = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const result = await joinPublicContest(authUser.uid, params.slateId);
      if (result?.noop) {
        Alert.alert('Heads up', result.noop);
        setLoading(false);
        return;
      }
      if (result?.error) {
        Alert.alert('Error', result.error);
        setLoading(false);
        return;
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to join contest. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
      </TouchableOpacity>

      {params.slateName ? (
        <Text style={styles.slateName}>{params.slateName}</Text>
      ) : null}
      <Text style={styles.header}>Who Will you Play?</Text>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/(app)/challenge/select',
              params: { slateId: params.slateId, slateName: params.slateName },
            })
          }
        >
          <MaterialIcons name="person-search" size={36} color={Colors.accentPurple} />
          <Text style={styles.cardTitle}>Specific Opponent</Text>
          <Text style={styles.cardDescription}>Challenge a friend or rival</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleRandomOpponent}>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primaryBlue} />
          ) : (
            <>
              <MaterialIcons name="shuffle" size={36} color={Colors.primaryBlue} />
              <Text style={styles.cardTitle}>Random Opponent</Text>
              <Text style={styles.cardDescription}>Get matched with someone new</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  slateName: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingBottom: 4,
  },
  header: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.hero,
    color: Colors.white,
    textAlign: 'center',
    paddingBottom: 40,
  },
  cardsContainer: {
    width: '100%',
    paddingHorizontal: 30,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingTop: 10,
  },
  cardDescription: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.neutralMid,
    paddingTop: 8,
    textAlign: 'center',
  },
});
