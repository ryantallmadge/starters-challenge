import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import { useContestStore } from '../../src/stores/contestStore';
import { useUserStore } from '../../src/stores/userStore';
import getAvatarUrl from '../../src/utils/getAvatarUrl';

function getPlayerName(player: any) {
  if (player.type === 'team') return player.name;
  if (player.first_name && player.last_name) {
    return `${player.first_name[0]}. ${player.last_name}`;
  }
  return player.name || 'Unknown';
}

function pickWinner(user: any, opponent: any) {
  const userScore = Number(user.score || 0);
  const oppScore = Number(opponent.score || 0);

  if (
    opponent.scored &&
    (oppScore > userScore ||
      (oppScore === userScore && user.tie_breaker < opponent.tie_breaker))
  ) {
    return opponent;
  }

  if (
    user.scored &&
    (oppScore < userScore ||
      (oppScore === userScore && user.tie_breaker > opponent.tie_breaker))
  ) {
    return user;
  }

  return null;
}

function renderGameStatus(game: any) {
  if (game?.status) return game.status;
  return game?.time ? `${game.time}` : '';
}

export default function LiveScoringScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);
  const activeContestId = useContestStore((s) => s.activeContestId);

  const current = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;
  const opponent = current?.oppenent;

  if (!current || !user || !opponent) return null;

  const entryCost = current.slate?.entry_cost as number | undefined;
  const payout = current.slate?.payout as number | undefined;
  const slatePlayers = current.slate?.players || {};
  const tiers = current.slate?.tiers || [];
  const userPicks = current.picks || {};
  const opponentPicks = opponent.picks || {};
  const roundCount = current.draft?.order ? current.draft.order.length / 2 : 0;

  const pickData: { user: any; opponent: any }[] = [];
  for (let i = 0; i < roundCount; i++) {
    pickData.push({
      user: slatePlayers[userPicks[i]],
      opponent: slatePlayers[opponentPicks[i]],
    });
  }

  let userWins = 0;
  let oppWins = 0;
  pickData.forEach(({ user: u, opponent: o }) => {
    if (u && o) {
      const winner = pickWinner(u, o);
      if (winner === u) userWins++;
      else if (winner === o) oppWins++;
    }
  });

  const maxWins = Math.max(roundCount, 1);
  const userBarWidth = userWins > 0 ? `${(userWins / maxWins) * 50}%` : '0%';
  const oppBarWidth = oppWins > 0 ? `${(oppWins / maxWins) * 50}%` : '0%';

  const renderPickCard = ({ item, index }: { item: { user: any; opponent: any }; index: number }) => {
    const { user: userPlayer, opponent: oppPlayer } = item;
    const tier = tiers[index];
    if (!userPlayer || !oppPlayer) return null;

    const winner = pickWinner(userPlayer, oppPlayer);
    const userWon = winner && winner.id === userPlayer.id;
    const oppWon = winner && winner.id === oppPlayer.id;

    return (
      <View style={styles.battleCard}>
        <View style={styles.roundPill}>
          <Text style={styles.roundPillText}>
            ROUND {index + 1}{tier?.question ? `  •  ${tier.question}` : ''}
          </Text>
        </View>

        <View style={styles.battleRow}>
          <View style={[styles.playerSide, userWon && styles.winningSide]}>
            {userWon && (
              <MaterialIcons
                name="emoji-events"
                size={18}
                color={Colors.accentYellow}
                style={styles.trophyIcon}
              />
            )}
            <Image
              style={styles.playerThumbnail}
              source={{ uri: userPlayer.thumbnail }}
            />
            <Text
              style={[
                styles.playerName,
                userWon && styles.winnerName,
                oppWon && styles.loserName,
              ]}
              numberOfLines={1}
            >
              {getPlayerName(userPlayer)}
            </Text>
            <View style={[styles.scoreBadge, userWon && styles.winnerScoreBadge]}>
              <Text
                style={[styles.scoreText, userWon && styles.winnerScoreText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {userPlayer.score ?? '-'}
              </Text>
            </View>
            {renderGameStatus(userPlayer.game) ? (
              <Text style={styles.gameStatusText}>{renderGameStatus(userPlayer.game)}</Text>
            ) : null}
          </View>

          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.vsLine} />
          </View>

          <View style={[styles.playerSide, oppWon && styles.winningSide]}>
            {oppWon && (
              <MaterialIcons
                name="emoji-events"
                size={18}
                color={Colors.accentYellow}
                style={styles.trophyIcon}
              />
            )}
            <Image
              style={styles.playerThumbnail}
              source={{ uri: oppPlayer.thumbnail }}
            />
            <Text
              style={[
                styles.playerName,
                oppWon && styles.winnerName,
                userWon && styles.loserName,
              ]}
              numberOfLines={1}
            >
              {getPlayerName(oppPlayer)}
            </Text>
            <View style={[styles.scoreBadge, oppWon && styles.winnerScoreBadge]}>
              <Text
                style={[styles.scoreText, oppWon && styles.winnerScoreText]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {oppPlayer.score ?? '-'}
              </Text>
            </View>
            {renderGameStatus(oppPlayer.game) ? (
              <Text style={styles.gameStatusText}>{renderGameStatus(oppPlayer.game)}</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgb(0,81,255)', 'rgb(0,137,255)', 'rgb(0,157,255)']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.avatarRow}>
          <View style={styles.avatarSide}>
            <Image style={styles.avatar} source={getAvatarUrl(user.avatar)} />
            <Text style={styles.displayName} numberOfLines={1}>{user.display_name}</Text>
          </View>

          <Image
            style={styles.vsImage}
            source={require('../../assets/images/play-tab/vsBlue.png')}
          />

          <View style={styles.avatarSide}>
            <Image style={styles.avatar} source={getAvatarUrl(opponent.avatar || '')} />
            <Text style={styles.displayName} numberOfLines={1}>{opponent.display_name}</Text>
          </View>
        </View>

        <View style={styles.stakesRow}>
          <View style={styles.stakePill}>
            <MaterialIcons name="toll" size={14} color={Colors.accentYellow} />
            <Text style={styles.stakeLabel}>Entry</Text>
            <Text style={styles.stakeValue} numberOfLines={1}>
              {entryCost ? `${entryCost} coins` : 'Free'}
            </Text>
          </View>
          <View style={styles.stakePill}>
            <MaterialIcons name="emoji-events" size={14} color={Colors.accentYellow} />
            <Text style={styles.stakeLabel}>Win</Text>
            <Text style={styles.stakeValue} numberOfLines={1}>
              {payout ? `${payout} coins` : 'Bragging Rights'}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[styles.progressBarSide, {
              width: userBarWidth as any,
              left: 0,
            }]}
          >
            <LinearGradient
              colors={['rgb(67,255,176)', 'rgb(5,208,123)']}
              style={styles.progressBarFill}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          <View
            style={[styles.progressBarSide, {
              width: oppBarWidth as any,
              right: 0,
            }]}
          >
            <LinearGradient
              colors={['rgb(67,255,176)', 'rgb(5,208,123)']}
              style={styles.progressBarFill}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          <View style={styles.scoreTally}>
            <Text style={styles.scoreTallyText}>{userWins} - {oppWins}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={pickData}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderPickCard}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    width: '100%',
    paddingTop: 54,
    paddingBottom: 16,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 54,
    zIndex: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
  avatarSide: {
    alignItems: 'center',
    width: 110,
  },
  avatar: {
    width: 90,
    height: 90,
  },
  vsImage: {
    width: 32,
    height: 32,
    marginBottom: 18,
  },
  displayName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 13,
    color: Colors.white,
    textAlign: 'center',
    marginTop: 4,
  },
  stakesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  stakePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  stakeLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stakeValue: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.md,
    color: Colors.white,
    maxWidth: 100,
  },
  progressBar: {
    width: '85%',
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarSide: {
    borderRadius: 12,
    height: 24,
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: 24,
  },
  scoreTally: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  scoreTallyText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.md,
    color: Colors.white,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 30,
  },
  battleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  roundPill: {
    backgroundColor: Colors.backgroundDark,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  roundPillText: {
    fontFamily: Fonts.arnoldSans,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  winningSide: {
    backgroundColor: 'rgba(5,208,123,0.08)',
  },
  trophyIcon: {
    marginBottom: 2,
  },
  playerThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  playerName: {
    fontFamily: Fonts.vanguardBold,
    color: Colors.black,
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  winnerName: {
    color: Colors.successGreen,
  },
  loserName: {
    opacity: 0.45,
  },
  scoreBadge: {
    marginTop: 6,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: Colors.neutralLight,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerScoreBadge: {
    borderColor: Colors.successGreen,
    backgroundColor: 'rgba(5,208,123,0.1)',
  },
  scoreText: {
    fontFamily: Fonts.vanguardExtraBold,
    color: Colors.black,
    fontSize: 22,
    textAlign: 'center',
    width: 42,
  },
  winnerScoreText: {
    color: Colors.successGreen,
  },
  gameStatusText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
    marginTop: 4,
    textAlign: 'center',
  },
  vsDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    paddingVertical: 8,
  },
  vsLine: {
    width: 1.5,
    height: 20,
    backgroundColor: Colors.neutralLight,
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  vsText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1,
  },
});
