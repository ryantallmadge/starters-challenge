import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import { useContestStore } from '../../src/stores/contestStore';
import { useUserStore } from '../../src/stores/userStore';

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

function getCircleColors(player: any, winner: any): readonly [string, string] {
  if (!winner) return ['#FFFFFF', '#FFFFFF'];
  if (player.id === winner.id) return ['rgb(67,255,176)', 'rgb(11,217,131)'];
  return ['#FFFFFF', '#FFFFFF'];
}

function getNameColor(player: any, winner: any) {
  if (!winner) return {};
  if (player.id === winner.id) return { color: Colors.successGreen };
  return {};
}

function renderGameStatus(game: any) {
  if (game?.status) return game.status;
  return game?.time ? `Game Start | ${game.time}` : '';
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

  const wager = current.wager || 'Bragging Rights';
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

  const maxWins = 3;
  const userBarWidth = userWins < maxWins ? `${(userWins / maxWins) * 50}%` : '50%';
  const oppBarWidth = oppWins < maxWins ? `${(oppWins / maxWins) * 50}%` : '50%';

  const renderWinnerHighlight = (player: any, winner: any, isOpponent: boolean) => {
    if (!winner || player.id !== winner.id) return null;

    if (!isOpponent) {
      return (
        <LinearGradient
          colors={['rgb(193,255,229)', '#FFFFFF']}
          style={[styles.winnerHighlight, { left: 0 }]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
        />
      );
    }
    return (
      <LinearGradient
        colors={['rgb(193,255,229)', '#FFFFFF']}
        style={[styles.winnerHighlight, { right: 0 }]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 1 }}
      />
    );
  };

  const renderPickCard = ({ item, index }: { item: { user: any; opponent: any }; index: number }) => {
    const { user: userPlayer, opponent: oppPlayer } = item;
    const tier = tiers[index];
    if (!userPlayer || !oppPlayer) return null;

    const winner = pickWinner(userPlayer, oppPlayer);

    return (
      <View>
        <View style={styles.playerCard}>
          {renderWinnerHighlight(userPlayer, winner, false)}
          {renderWinnerHighlight(oppPlayer, winner, true)}

          <View style={styles.playerPhotoUser}>
            <Image
              style={styles.playerThumbnail}
              source={{ uri: userPlayer.thumbnail }}
            />
          </View>

          <LinearGradient
            colors={getCircleColors(userPlayer, winner)}
            style={[styles.scoreCircle, styles.userScorePosition]}
          >
            <Text style={styles.scoreText} numberOfLines={1} adjustsFontSizeToFit>
              {userPlayer.score}
            </Text>
          </LinearGradient>

          <Text style={styles.question}>{tier?.question}</Text>
          <Text style={[styles.playerName, getNameColor(userPlayer, winner)]}>
            {getPlayerName(userPlayer)}
          </Text>
          <Text style={styles.tierType}>{tier?.type}</Text>
          <Text style={[styles.playerName, getNameColor(oppPlayer, winner)]}>
            {getPlayerName(oppPlayer)}
          </Text>

          <LinearGradient
            colors={getCircleColors(oppPlayer, winner)}
            style={[styles.scoreCircle, styles.oppScorePosition]}
          >
            <Text style={styles.scoreText} numberOfLines={1} adjustsFontSizeToFit>
              {oppPlayer.score}
            </Text>
          </LinearGradient>

          <View style={styles.playerPhotoOpp}>
            <Image
              style={styles.playerThumbnail}
              source={{ uri: oppPlayer.thumbnail }}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.gameTime}>
            {renderGameStatus(userPlayer.game)}
          </Text>
          <Text style={styles.gameTime}>
            {renderGameStatus(oppPlayer.game)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgb(0,81,255)', 'rgb(0,157,255)']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>This Game is For:</Text>
        <Text style={styles.headerTitleLabel} adjustsFontSizeToFit numberOfLines={1}>
          {wager}
        </Text>
        <View style={styles.users}>
          <Text style={[styles.displayName, { textAlign: 'left' }]}>
            {user.display_name}
          </Text>
          <Text style={[styles.displayName, { textAlign: 'right' }]}>
            {opponent.display_name}
          </Text>
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

          <Image
            style={{ width: 80, height: 42 }}
            source={require('../../assets/images/draft/theBelt.png')}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={pickData}
        keyExtractor={(_, index) => String(index)}
        renderItem={renderPickCard}
        contentContainerStyle={{ paddingBottom: 10 }}
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
  },
  header: {
    height: 185,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  headerTitleText: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  headerTitleLabel: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 23,
    color: Colors.white,
  },
  users: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  displayName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 14,
    color: Colors.white,
  },
  progressBar: {
    width: '90%',
    height: 20,
    borderRadius: 8.5,
    backgroundColor: '#80C6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarSide: {
    borderRadius: 8.5,
    height: 20,
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: 20,
  },
  list: {
    backgroundColor: Colors.white,
    height: '100%',
    width: '100%',
  },
  playerCard: {
    width: '100%',
    backgroundColor: Colors.white,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPhotoUser: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  playerPhotoOpp: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  playerThumbnail: {
    width: 90,
    height: 90,
  },
  scoreCircle: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderColor: Colors.black,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 99999,
  },
  userScorePosition: {
    left: 60,
    top: 60,
  },
  oppScorePosition: {
    right: 60,
    top: 60,
  },
  scoreText: {
    fontFamily: Fonts.vanguardBold,
    color: Colors.black,
    fontSize: 25,
    textAlign: 'center',
    position: 'relative',
    top: -3,
    width: 35,
    zIndex: 9999,
  },
  question: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.lg,
    color: 'rgb(99,110,127)',
    paddingBottom: 5,
  },
  playerName: {
    fontFamily: Fonts.vanguardBold,
    color: Colors.black,
    fontSize: FontSizes.xxl,
    textAlign: 'center',
  },
  tierType: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 14,
    letterSpacing: 1,
    paddingVertical: 3,
  },
  winnerHighlight: {
    height: '100%',
    width: '50%',
    position: 'absolute',
    top: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 20,
    borderTopColor: Colors.neutralLight,
    borderTopWidth: 1,
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
    paddingHorizontal: 15,
  },
  gameTime: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
  },
});
