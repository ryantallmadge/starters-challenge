import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import type { ContestArchive } from '../types';

export default function History() {
  const authUser = useAuthStore((s) => s.user);
  const userHistory = useUserStore((s) => s.userHistory);
  const fetchUserHistory = useUserStore((s) => s.fetchUserHistory);

  useEffect(() => {
    if (authUser) fetchUserHistory(authUser.uid);
  }, [authUser?.uid]);

  const renderItem = ({ item }: { item: ContestArchive }) => {
    const isWinner = item.user_won;
    const headerColors = isWinner
      ? (['rgb(255,193,0)', 'rgb(255,220,100)'] as const)
      : (['rgb(200,50,50)', 'rgb(255,100,100)'] as const);
    const headerText = isWinner ? 'WINNER' : 'LOSER';
    const headerIcon = isWinner
      ? require('../../assets/images/history/winner.png')
      : require('../../assets/images/history/loser.png');

    return (
      <View style={styles.card}>
        <LinearGradient colors={[...headerColors]} style={styles.cardHeader}>
          <Image style={{ width: 30, height: 30 }} source={headerIcon} />
          <Text style={styles.cardHeaderText}>{headerText}</Text>
        </LinearGradient>
        <View style={styles.cardBody}>
          <Image style={styles.opponentAvatar} source={getAvatarUrl(item.oppenent?.avatar || '')} />
          <View style={styles.cardInfo}>
            <Text style={styles.opponentName}>{item.oppenent?.display_name}</Text>
            <Text style={styles.wagerText}>{item.wager || 'Bragging Rights'}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (userHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No contest history yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={userHistory}
      renderItem={renderItem}
      keyExtractor={(item, idx) => item.id || String(idx)}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, width: '100%', paddingHorizontal: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: Fonts.vanguardMedium, fontSize: FontSizes.lg, color: Colors.neutralMid },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  cardHeaderText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  opponentAvatar: { width: 60, height: 60, borderRadius: 30 },
  cardInfo: { marginLeft: 15 },
  opponentName: { fontFamily: Fonts.robotoCondensedBold, fontSize: FontSizes.base },
  wagerText: { fontFamily: Fonts.vanguardMedium, fontSize: FontSizes.md, color: Colors.neutralMid, paddingTop: 4 },
});
