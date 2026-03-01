import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useLeaderboardStore } from '../../../src/stores/leaderboardStore';
import AmazonPrizePool from '../../../src/components/AmazonPrizePool';
import getAvatarUrl from '../../../src/utils/getAvatarUrl';
import type { LeaderboardEntry } from '../../../src/types';

export default function LeaderboardScreen() {
  const leaderboard = useLeaderboardStore((s) => s.leaderboard);
  const leaderboardState = useLeaderboardStore((s) => s.leaderboardState);

  if (leaderboardState.state === 'amazon') {
    return (
      <View style={{ flex: 1, paddingTop: 50 }}>
        <AmazonPrizePool />
      </View>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const renderHeader = () => (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.header}>
      <Image
        source={require('../../../assets/images/leaderboard/sunBurst.png')}
        style={styles.sunBurst}
        resizeMode="contain"
      />
      <View style={styles.podium}>
        {top3[1] && (
          <View style={styles.podiumSpot}>
            <Image source={require('../../../assets/images/leaderboard/secondPlace.png')} style={styles.medalImage} />
            <Image style={styles.podiumAvatar} source={getAvatarUrl(top3[1].user.avatar)} />
            <Text style={styles.podiumName}>{top3[1].user.display_name}</Text>
          </View>
        )}
        {top3[0] && (
          <View style={[styles.podiumSpot, { marginTop: -20 }]}>
            <Image source={require('../../../assets/images/leaderboard/firstPlace.png')} style={styles.medalImage} />
            <Image style={styles.podiumAvatar} source={getAvatarUrl(top3[0].user.avatar)} />
            <Text style={styles.podiumName}>{top3[0].user.display_name}</Text>
          </View>
        )}
        {top3[2] && (
          <View style={styles.podiumSpot}>
            <Image source={require('../../../assets/images/leaderboard/thirdPlace.png')} style={styles.medalImage} />
            <Image style={styles.podiumAvatar} source={getAvatarUrl(top3[2].user.avatar)} />
            <Text style={styles.podiumName}>{top3[2].user.display_name}</Text>
          </View>
        )}
      </View>
      {leaderboard.length > 0 && (
        <View style={styles.headerTable}>
          <Text style={[styles.headerTableLabel, styles.headerTablePlayer]}>Player</Text>
          <Text style={styles.headerTableLabel}>Rounds Won</Text>
          <Text style={styles.headerTableLabel}>Record</Text>
          <Text style={[styles.headerTableLabel, styles.headerTableAvatar]}>Avatar</Text>
        </View>
      )}
    </LinearGradient>
  );

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const record = item.record ? `${item.record.wins}-${item.record.losses}` : '0-0';
    return (
      <View style={styles.leaderRow}>
        <View style={styles.leaderPlayerCell}>
          <Text style={styles.leaderRank}>{index + 4}</Text>
          <Text style={styles.leaderName} numberOfLines={1}>{item.user.display_name}</Text>
        </View>
        <Text style={styles.leaderRoundsWon}>{item.tiers_won || 0}</Text>
        <Text style={styles.leaderRecord}>{record}</Text>
        <Image style={styles.leaderAvatar} source={getAvatarUrl(item.user.avatar)} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No leaderboard data yet.</Text>
      <Text style={styles.emptySubText}>Play some rounds to get on the board!</Text>
    </View>
  );

  return (
    <FlatList
      data={rest}
      renderItem={renderItem}
      keyExtractor={(item) => item.user.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={leaderboard.length === 0 ? renderEmpty : undefined}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundLight },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 10,
  },
  sunBurst: {
    position: 'absolute',
    top: 20,
    width: '100%',
    height: 200,
    opacity: 0.3,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
    paddingBottom: 20,
  },
  podiumSpot: { alignItems: 'center', width: 100 },
  medalImage: { width: 35, height: 35, marginBottom: 5 },
  podiumAvatar: { width: 70, height: 70, borderRadius: 35 },
  podiumName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
    textAlign: 'center',
    paddingTop: 5,
  },
  headerTable: {
    width: '100%',
    height: 30,
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTableLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    color: Colors.leaderboardLabel,
  },
  headerTablePlayer: { width: 155, paddingLeft: 55 },
  headerTableAvatar: { paddingRight: 10 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
  },
  leaderPlayerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 155,
  },
  leaderRank: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    width: 30,
    textAlign: 'center',
  },
  leaderName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.md,
    flex: 1,
  },
  leaderRoundsWon: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 17,
    textAlign: 'center',
    flex: 1,
  },
  leaderRecord: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 17,
    textAlign: 'right',
    width: 40,
  },
  leaderAvatar: { height: 56, width: 56 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.lg,
    color: Colors.neutralMid,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.base,
    color: Colors.neutralMid,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.6,
  },
});
