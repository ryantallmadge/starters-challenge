import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useContestStore } from '../stores/contestStore';
import { useUserStore } from '../stores/userStore';
import type { CurrentContest } from '../types';

export default function JoinedDrafts() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const setActiveContest = useContestStore((s) => s.setActiveContest);
  const userContests = useContestStore((s) => s.userContests);

  const getByStage = (stage: string): [string, CurrentContest][] => {
    if (!userContests?.contests) return [];
    return Object.entries(userContests.contests).filter(([, c]) => c.stage === stage);
  };

  const draftContests = getByStage('draft');
  const pendingContests = getByStage('pending');
  const liveContests = getByStage('live');
  const hasAny = draftContests.length > 0 || pendingContests.length > 0 || liveContests.length > 0;

  const handleEnterDraft = (contestId: string) => {
    setActiveContest(contestId);
    router.push('/(app)/draft');
  };

  const handleViewScoring = (contestId: string) => {
    setActiveContest(contestId);
    router.push('/(app)/live-scoring');
  };

  const renderDraftCard = (contestId: string, contest: CurrentContest) => {
    const opponent = contest.oppenent;
    const draft = contest.draft;
    const isUserTurn = draft?.on_the_clock === user?.id;

    return (
      <TouchableOpacity
        key={contestId}
        style={styles.card}
        onPress={() => handleEnterDraft(contestId)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={
            isUserTurn
              ? ['rgb(11,152,93)', 'rgb(18,200,123)']
              : ['rgb(0,81,255)', 'rgb(0,157,255)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBody}
        >
          <View style={[styles.statusDot, { backgroundColor: isUserTurn ? Colors.accentYellow : Colors.white }]} />
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>
                {isUserTurn ? 'YOUR PICK' : 'DRAFTING'}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {contest.slate_name || 'Draft'}
              </Text>
              {draft && (
                <Text style={styles.cardDetail}>
                  Rd {draft.round} · Pick {(draft.current_pick ?? 0) + 1}
                </Text>
              )}
            </View>
            <View style={styles.avatarGroup}>
              {user && (
                <Image style={styles.avatar} source={getAvatarUrl(user.avatar)} />
              )}
              <Image
                style={[styles.avatar, styles.avatarOverlap]}
                source={getAvatarUrl(opponent?.avatar || '')}
              />
            </View>
            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPendingCard = (contestId: string, contest: CurrentContest) => (
    <View key={contestId} style={styles.card}>
      <LinearGradient
        colors={['rgb(50,20,100)', 'rgb(85,0,198)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardBody}
      >
        <View style={[styles.statusDot, { backgroundColor: Colors.accentPurple }]} />
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>UPCOMING</Text>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {contest.slate_name || 'Waiting'}
            </Text>
            <Text style={styles.cardDetail}>Waiting for opponent...</Text>
          </View>
          <View style={styles.avatarGroup}>
            {user && (
              <Image style={styles.avatar} source={getAvatarUrl(user.avatar)} />
            )}
            <Image
              style={[styles.mysteryAvatar, styles.avatarOverlap]}
              resizeMode="contain"
              source={require('../../assets/images/play-tab/mysteryPlayer.png')}
            />
          </View>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
        </View>
      </LinearGradient>
    </View>
  );

  const getTierWins = (contest: CurrentContest) => {
    let userWins = 0;
    let oppWins = 0;
    const picks = contest.picks;
    const oppPicks = contest.oppenent?.picks;
    const players = contest.slate?.players;
    if (!picks || !oppPicks || !players) return { userWins, oppWins };

    const rounds = Math.min(picks.length, oppPicks.length);
    for (let i = 0; i < rounds; i++) {
      const up = players[picks[i]] as any;
      const op = players[oppPicks[i]] as any;
      if (!up || !op) continue;
      const uScore = Number(up.score || 0);
      const oScore = Number(op.score || 0);
      const uScored = up.scored;
      const oScored = op.scored;
      if (!uScored && !oScored) continue;

      if (uScore > oScore) userWins++;
      else if (uScore < oScore) oppWins++;
      else {
        const uTB = Number(up.tie_breaker || 0);
        const oTB = Number(op.tie_breaker || 0);
        if (uTB < oTB) userWins++;
        else if (oTB < uTB) oppWins++;
      }
    }
    return { userWins, oppWins };
  };

  const renderLiveCard = (contestId: string, contest: CurrentContest) => {
    const opponent = contest.oppenent;
    const { userWins, oppWins } = getTierWins(contest);
    const isWinning = userWins > oppWins;
    const isLosing = oppWins > userWins;

    const gradientColors: [string, string] = isWinning
      ? ['rgb(5,130,80)', 'rgb(11,152,93)']
      : isLosing
        ? ['rgb(160,30,30)', 'rgb(200,50,50)']
        : ['rgb(0,81,255)', 'rgb(0,157,255)'];

    const dotColor = isWinning
      ? Colors.successGreenCyan
      : isLosing
        ? '#FF6B6B'
        : Colors.primaryBlueLight;

    return (
      <TouchableOpacity
        key={contestId}
        style={styles.card}
        onPress={() => handleViewScoring(contestId)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBody}
        >
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <View style={styles.cardRow}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>LIVE</Text>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {contest.slate_name || 'In Progress'}
              </Text>
              <Text style={styles.cardDetail}>
                Tiers: {userWins} - {oppWins}
                {isWinning ? '  ·  Winning' : isLosing ? '  ·  Losing' : userWins === 0 && oppWins === 0 ? '' : '  ·  Tied'}
              </Text>
            </View>
            <View style={styles.tierScore}>
              <Text style={styles.tierScoreText}>{userWins}</Text>
              <Text style={styles.tierScoreDivider}>:</Text>
              <Text style={styles.tierScoreText}>{oppWins}</Text>
            </View>
            <View style={styles.avatarGroup}>
              {user && (
                <Image style={styles.avatar} source={getAvatarUrl(user.avatar)} />
              )}
              <Image
                style={[styles.avatar, styles.avatarOverlap]}
                source={getAvatarUrl(opponent?.avatar || '')}
              />
            </View>
            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      bounces={false}
    >
      {!hasAny ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="inbox" size={56} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyTitle}>No Joined Drafts</Text>
          <Text style={styles.emptySub}>
            Head to the Lobby to join a slate
          </Text>
        </View>
      ) : (
        <>
          {pendingContests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="schedule" size={18} color={Colors.accentPurple} />
                <Text style={styles.sectionTitle}>Upcoming</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingContests.length}</Text>
                </View>
              </View>
              {pendingContests.map(([id, c]) => renderPendingCard(id, c))}
            </View>
          )}

          {draftContests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="edit-note" size={18} color={Colors.accentOrange} />
                <Text style={styles.sectionTitle}>Drafting</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{draftContests.length}</Text>
                </View>
              </View>
              {draftContests.map(([id, c]) => renderDraftCard(id, c))}
            </View>
          )}

          {liveContests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="sports-score" size={18} color={Colors.successGreen} />
                <Text style={styles.sectionTitle}>Live</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{liveContests.length}</Text>
                </View>
              </View>
              {liveContests.map(([id, c]) => renderLiveCard(id, c))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  emptyState: {
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

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    paddingLeft: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.xs,
    color: Colors.white,
  },

  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
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
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.lg,
    color: Colors.white,
    textTransform: 'uppercase',
    paddingTop: 1,
  },
  cardDetail: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
    color: 'rgba(255,255,255,0.6)',
    paddingTop: 3,
  },

  tierScore: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
    marginRight: 6,
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
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  mysteryAvatar: {
    width: 32,
    height: 32,
  },
  avatarOverlap: {
    marginLeft: -10,
  },
});
