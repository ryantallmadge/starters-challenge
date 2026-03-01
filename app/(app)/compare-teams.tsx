import React from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import { useContestStore } from '../../src/stores/contestStore';
import { useUserStore } from '../../src/stores/userStore';
import type { PlayerData } from '../../src/types';

export default function CompareTeamsScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);

  const activeContestId = useContestStore((s) => s.activeContestId);
  const current = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;
  const opponent = current?.oppenent;
  const draft = current?.draft;
  const slatePlayers: Record<string, PlayerData> = current?.slate?.players || {};

  if (!current || !user || !opponent) return null;

  const totalRounds = draft?.order ? Math.floor(draft.order.length / 2) : 5;

  const getPickData = () => {
    const picks = [];
    for (let i = 0; i < totalRounds; i++) {
      const userPickId = current.picks?.[i];
      const opponentPickId = opponent.picks?.[i];
      picks.push({
        user: userPickId ? slatePlayers[userPickId] : undefined,
        opponent: opponentPickId ? slatePlayers[opponentPickId] : undefined,
      });
    }
    return picks;
  };

  const getPlayerName = (player?: PlayerData) => {
    if (!player) return 'TBD';
    if (player.type === 'team') return player.name;
    if (player.name) return player.name;
    if (player.first_name && player.last_name) {
      return `${player.first_name[0]}. ${player.last_name}`;
    }
    return 'TBD';
  };

  const getPlayerPhoto = (player?: PlayerData) => {
    if (!player || !player.thumbnail) {
      return (
        <Image
          style={styles.playerThumbnail}
          source={require('../../assets/images/draft/silhouette.png')}
        />
      );
    }
    return (
      <Image style={styles.playerThumbnail} source={{ uri: player.thumbnail }} />
    );
  };

  const renderPickCard = ({ item, index }: { item: { user?: PlayerData; opponent?: PlayerData }; index: number }) => {
    const userPlayer = item.user;
    const oppPlayer = item.opponent;
    const hasPlayers = userPlayer || oppPlayer;

    return (
      <View style={styles.playerCard}>
        <View style={styles.playerCardHeader}>
          <View style={styles.playerCardUser}>{getPlayerPhoto(userPlayer)}</View>
          <View style={styles.vs}>
            <Text style={styles.playerCardRound}>ROUND {index + 1}</Text>
            {hasPlayers ? (
              <View>
                <Text style={styles.playerName} numberOfLines={1}>{getPlayerName(userPlayer)}</Text>
                <Text style={styles.vsLabel}>VS</Text>
                <Text style={styles.playerName} numberOfLines={1}>{getPlayerName(oppPlayer)}</Text>
              </View>
            ) : (
              <Text style={styles.notYetText}>Players not drafted yet</Text>
            )}
          </View>
          <View style={styles.playerCardOpponent}>{getPlayerPhoto(oppPlayer)}</View>
        </View>
        <View style={styles.playerCardFooter}>
          <Text style={styles.playerGameTime}>
            {userPlayer?.game?.time ? `Game Start | ${userPlayer.game.time}` : ''}
          </Text>
          <Text style={styles.playerGameTime}>
            {oppPlayer?.game?.time ? `Game Start | ${oppPlayer.game.time}` : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient style={styles.header} colors={['rgb(0,81,255)', 'rgb(0,157,255)']}>
        <Text style={styles.headerTitleText}>Compare Teams</Text>
        <TouchableOpacity style={styles.backIconTouch} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.users}>
          <Text style={[styles.displayName, { textAlign: 'left' }]}>{user.display_name}</Text>
          <Text style={[styles.displayName, { textAlign: 'right' }]}>{opponent.display_name}</Text>
        </View>
        <View style={styles.progressBar}>
          <Image
            style={{ width: 80, height: 42 }}
            source={require('../../assets/images/draft/theBelt.png')}
          />
        </View>
      </LinearGradient>
      <FlatList
        style={{ backgroundColor: Colors.white, height: '100%', width: '100%' }}
        keyExtractor={(_, index) => `${index}`}
        data={getPickData()}
        renderItem={renderPickCard}
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
    height: 175,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerTitleText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxxl,
    color: Colors.white,
  },
  backIconTouch: {
    position: 'absolute',
    left: 20,
    top: 50,
  },
  users: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
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
  playerCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderBottomColor: 'rgb(220,224,230)',
    borderBottomWidth: 1,
  },
  playerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 110,
  },
  playerCardUser: {
    paddingLeft: 15,
    paddingBottom: 10,
  },
  playerCardOpponent: {
    paddingRight: 15,
    paddingBottom: 10,
  },
  playerThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  playerCardRound: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 12,
    color: 'rgb(150,163,184)',
  },
  vs: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 130,
    paddingBottom: 20,
  },
  playerName: {
    fontFamily: Fonts.vanguardBold,
    color: Colors.black,
    fontSize: FontSizes.xxl,
    textAlign: 'center',
  },
  vsLabel: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 12,
    color: 'rgb(150,163,184)',
    textAlign: 'center',
  },
  notYetText: {
    color: 'rgb(150,163,184)',
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    lineHeight: 24,
    paddingTop: 5,
    textAlign: 'center',
  },
  playerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 20,
    borderTopColor: 'rgb(220,224,230)',
    borderTopWidth: 1,
    paddingLeft: 15,
    paddingRight: 15,
  },
  playerGameTime: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
  },
});
