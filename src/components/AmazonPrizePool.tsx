import React from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useLeaderboardStore } from '../stores/leaderboardStore';
import type { TierWinEntry } from '../types';

export default function AmazonPrizePool() {
  const tierWins = useLeaderboardStore((s) => s.tierWins);
  const leaderboardState = useLeaderboardStore((s) => s.leaderboardState);

  const renderItem = ({ item, index }: { item: TierWinEntry; index: number }) => {
    const rounds = item.rounds || [];
    return (
      <View style={styles.row}>
        <View style={styles.rankCell}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        <Image style={styles.avatar} source={getAvatarUrl(item.user?.avatar || '')} />
        <View style={styles.nameCell}>
          <Text style={styles.nameText}>{item.user?.display_name}</Text>
        </View>
        <View style={styles.roundsContainer}>
          {rounds.map((won, i) => (
            <Image
              key={i}
              style={styles.roundIcon}
              source={
                won
                  ? require('../../assets/images/live-card/greenCheck.png')
                  : require('../../assets/images/live-card/unfinishedRoundBlue.png')
              }
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.header}>
        <Image
          style={styles.giftCardImage}
          source={require('../../assets/images/play-tab/amazonGiftCard.png')}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>{leaderboardState.title || 'Amazon Prize Pool'}</Text>
      </LinearGradient>
      <FlatList
        data={tierWins}
        renderItem={renderItem}
        keyExtractor={(item, idx) => item.user?.id || String(idx)}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingTop: 50,
  },
  giftCardImage: { width: 200, height: 120 },
  headerTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    color: Colors.white,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
  },
  rankCell: { width: 30 },
  rankText: { fontFamily: Fonts.vanguardMedium, fontSize: FontSizes.base },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  nameCell: { flex: 1, paddingLeft: 10 },
  nameText: { fontFamily: Fonts.robotoCondensedBold, fontSize: FontSizes.md },
  roundsContainer: { flexDirection: 'row', gap: 4 },
  roundIcon: { width: 16, height: 16 },
});
