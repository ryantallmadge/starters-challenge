import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import type { ContestArchive } from '../types';

function formatDate(createdAt: ContestArchive['created_at']): string {
  const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt as any);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function History() {
  const authUser = useAuthStore((s) => s.user);
  const userHistory = useUserStore((s) => s.userHistory);
  const fetchUserHistory = useUserStore((s) => s.fetchUserHistory);

  useEffect(() => {
    if (authUser) fetchUserHistory(authUser.uid);
  }, [authUser?.uid]);

  const renderItem = ({ item }: { item: ContestArchive }) => {
    const isWinner = item.user_won;
    const cardGradient: [string, string] = isWinner
      ? ['rgb(5,130,80)', 'rgb(11,152,93)']
      : ['rgb(160,30,30)', 'rgb(200,50,50)'];
    const resultLabel = isWinner ? 'WIN' : 'LOSS';
    const dotColor = isWinner ? Colors.successGreenCyan : '#FF6B6B';

    const entryCost = item.entry_cost ?? 0;
    const payout = item.payout ?? 0;
    const tiersWon = item.tiers_won ?? 0;
    const opponentTiersWon = item.opponent_tiers_won ?? 0;
    const slateName = item.slate_name || item.wager || 'Contest';
    const dateStr = formatDate(item.created_at);

    return (
      <View style={styles.card}>
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBody}
        >
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <View style={styles.cardRow}>
            <Image
              style={styles.opponentAvatar}
              source={getAvatarUrl(item.oppenent?.avatar || '')}
            />
            <View style={styles.matchupInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.resultLabel}>{resultLabel}</Text>
                {dateStr ? <Text style={styles.dateText}>{dateStr}</Text> : null}
              </View>
              <Text style={styles.slateName} numberOfLines={1}>{slateName}</Text>
              <Text style={styles.opponentName}>
                vs {item.oppenent?.display_name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.tierScoreBadge}>
              <Text style={styles.tierScoreText}>{tiersWon}</Text>
              <Text style={styles.tierScoreDivider}>:</Text>
              <Text style={styles.tierScoreText}>{opponentTiersWon}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Entry</Text>
              <Text style={styles.statValue}>
                {entryCost > 0 ? `${entryCost}` : 'FREE'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Coins</Text>
              <Text
                style={[
                  styles.statValue,
                  isWinner && payout > 0 && styles.statValueWin,
                  !isWinner && entryCost > 0 && styles.statValueLoss,
                ]}
              >
                {isWinner && payout > 0 ? `+${payout}` : entryCost > 0 ? `-${entryCost}` : '0'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tiers Won</Text>
              <Text style={styles.statValue}>{tiersWon}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (userHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No History Yet</Text>
        <Text style={styles.emptySub}>
          Completed contests will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={userHistory}
      renderItem={renderItem}
      keyExtractor={(item, idx) => item.id || String(idx)}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    color: Colors.white,
    paddingTop: 16,
    textTransform: 'uppercase',
  },
  emptySub: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.5)',
    paddingTop: 6,
  },

  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardBody: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 20,
  },
  statusDot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opponentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  matchupInfo: {
    flex: 1,
    marginLeft: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dateText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
  },
  slateName: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.lg,
    color: Colors.white,
    textTransform: 'uppercase',
    paddingTop: 1,
  },
  opponentName: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
    paddingTop: 2,
  },
  tierScoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
  },
  tierScoreText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 16,
    color: Colors.white,
  },
  tierScoreDivider: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  statValueWin: {
    color: Colors.successGreenLight,
  },
  statValueLoss: {
    color: '#FF8A8A',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
