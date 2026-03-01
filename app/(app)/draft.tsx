import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import { useContestStore } from '../../src/stores/contestStore';
import { useUserStore } from '../../src/stores/userStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useDraftStore } from '../../src/stores/draftStore';
import getAvatarUrl from '../../src/utils/getAvatarUrl';
import type { PlayerData, TierData } from '../../src/types';

function padLeft(str: string | number, pad: string, length: number) {
  return (new Array(length + 1).join(pad) + str).slice(-length);
}

function formatTime(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = seconds - min * 60;
  return padLeft(min, '0', 2) + ':' + padLeft(sec, '0', 2);
}

export default function DraftScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);
  const activeContestId = useContestStore((s) => s.activeContestId);
  const draftPlayer = useDraftStore((s) => s.draftPlayer);
  const drafting = useDraftStore((s) => s.drafting);

  const insets = useSafeAreaInsets();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showScoring, setShowScoring] = useState(false);
  const [clock, setClock] = useState<string>('00:00');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;
  const draft = current?.draft;
  const opponent = current?.oppenent;
  const slatePlayers: Record<string, PlayerData> = current?.slate?.players || {};
  const slateTiers: TierData[] = current?.slate?.tiers || [];

  const isUserTurn = draft?.on_the_clock === authUser?.uid;
  const numberOfRounds = draft?.order ? Math.floor(draft.order.length / 2) : 5;
  const currentTier = slateTiers[draft?.round - 1] as TierData | undefined;
  const tierPlayerIds = currentTier?.players || [];

  const advanceClock = useCallback(() => {
    if (!draft?.next_pick_time) {
      setClock('Drafting');
      return;
    }
    const now = new Date().getTime();
    const target = new Date(draft.next_pick_time).getTime();
    const dif = Math.floor((target - now) / 1000);
    setClock(dif <= 0 ? 'Drafting' : formatTime(dif));

    timerRef.current = setTimeout(() => advanceClock(), 1000);
  }, [draft?.next_pick_time]);

  useEffect(() => {
    advanceClock();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [advanceClock, draft?.current_pick]);

  if (!current || !draft || !user) return null;

  const nextPick = draft.order?.[draft.current_pick + 1];
  const numPicks = nextPick && nextPick === draft.on_the_clock ? 2 : 1;

  const getWhosPick = () => {
    if (isUserTurn) return "It's Your Pick";
    return `${opponent?.display_name}'s Pick`;
  };

  const getPickText = () => {
    if (isUserTurn) {
      return `You have the next ${numPicks} pick${numPicks > 1 ? 's' : ''}`;
    }
    return `You are up in ${numPicks} pick${numPicks > 1 ? 's' : ''}`;
  };

  const getOnTheClockAvatar = () => {
    if (isUserTurn) return user.avatar;
    return opponent?.avatar || '';
  };

  const getBackgroundColors = (): readonly [string, string] => {
    if (isUserTurn) return ['rgb(75,242,172)', 'rgb(11,152,93)'];
    return ['rgb(12,22,56)', 'rgb(25,34,68)'];
  };

  const getPlayerName = (player: PlayerData) => {
    if (player.name) return player.name;
    if (player.first_name && player.last_name) {
      return `${player.first_name[0]}. ${player.last_name}`;
    }
    return 'Unknown';
  };

  const handleConfirmPick = async () => {
    if (!selectedPlayer || !authUser) return;
    draftPlayer(authUser.uid, selectedPlayer, draft.token || '', activeContestId || undefined).then(() => {
      setSelectedPlayer(null);
    });
  };

  // Draft completed
  if (current.stage === 'live') {
    if (timerRef.current) clearTimeout(timerRef.current);
    return (
      <LinearGradient
        style={styles.draftCompleted}
        colors={['rgb(0,128,255)', 'rgb(0,157,255)', 'rgb(0,128,255)', 'rgb(0,157,255)']}
      >
        <View style={styles.completedAvatars}>
          <Image
            style={styles.completedAvatar}
            source={getAvatarUrl(user.avatar)}
          />
          <Image
            style={styles.completedAvatar}
            source={getAvatarUrl(opponent?.avatar || '')}
          />
        </View>
        <Text style={styles.completedText}>Draft Has Completed!</Text>
        <Text style={[styles.completedText, { paddingBottom: 20 }]}>Good Luck</Text>
        <TouchableOpacity style={styles.confirmSelection} onPress={() => router.back()}>
          <Text style={styles.confirmSelectionText}>BACK TO LOBBY</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Render round ribbon with pick circles
  const renderRounds = () => {
    const rounds = [];
    for (let i = 1; i <= numberOfRounds; i++) {
      let pick1 = (i - 1) * 2;
      let pick2 = (i - 1) * 2 + 1;

      const getCircle = (pickIndex: number) => {
        if (pickIndex < draft.current_pick) {
          return (
            <LinearGradient
              key={pickIndex}
              colors={['rgb(255,237,204)', 'rgb(255,215,156)']}
              style={styles.roundCircle}
            />
          );
        } else if (pickIndex === draft.current_pick) {
          return <View key={pickIndex} style={[styles.roundCircle, styles.roundCircleSelected]} />;
        }
        return <View key={pickIndex} style={styles.roundCircle} />;
      };

      rounds.push(
        <View style={styles.round} key={i}>
          <Text style={[styles.roundLabel, draft.round === i && styles.roundLabelSelected]}>
            Round {i}
          </Text>
          <View style={styles.roundCircles}>
            {getCircle(pick1)}
            {getCircle(pick2)}
          </View>
        </View>
      );
    }
    return rounds;
  };

  // Render Cancel/Confirm bar when player is selected
  const renderSelectedOverlay = () => {
    if (drafting) {
      return (
        <LinearGradient
          colors={['rgb(253,188,110)', 'rgb(255,237,204)']}
          style={styles.draftingOverlay}
        >
          <Text style={styles.draftingText}>Drafting...</Text>
        </LinearGradient>
      );
    }
    return (
      <View style={styles.selectedOverlay}>
        <View style={styles.cancelHalf}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setSelectedPlayer(null)}
          >
            <Image
              style={{ height: 28, width: 28 }}
              source={require('../../assets/images/draft/cancel.png')}
            />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <LinearGradient colors={['rgb(253,188,110)', 'rgb(255,237,204)']} style={styles.confirmHalf}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPick}>
            <Image
              style={{ height: 28, width: 20 }}
              source={require('../../assets/images/draft/boltLeft.png')}
            />
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Render player info below thumbnail
  const renderPlayerInfo = (player: PlayerData) => {
    const name = getPlayerName(player);
    if (player.picked) {
      return (
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: 'rgb(195,211,237)' }]} numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </Text>
          <Text style={styles.pickedLabel}>Picked</Text>
        </View>
      );
    }
    return (
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit>{name}</Text>
        {currentTier?.key_stat && (
          <Text style={styles.playerKeyStat}>{player.key_stat} {currentTier.key_stat}</Text>
        )}
        <Text style={styles.playerPosition}>
          {player.position ? `${player.position} | ${player.team_abrev || player.team} - ` : ''}
          {player.game?.time || ''}
        </Text>
      </View>
    );
  };

  // Render a single player cell
  const renderPlayerCell = (playerId: string) => {
    const player = slatePlayers[playerId];
    if (!player) return null;

    if (selectedPlayer === playerId) {
      return renderSelectedOverlay();
    }

    return (
      <TouchableOpacity
        style={styles.playerCell}
        onPress={() => {
          if (!isUserTurn || player.picked) return;
          setSelectedPlayer(playerId);
        }}
      >
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {player.thumbnail ? (
            <Image style={styles.playerThumbnail} resizeMode="cover" source={{ uri: player.thumbnail }} />
          ) : (
            <Image
              style={styles.playerThumbnail}
              resizeMode="cover"
              source={require('../../assets/images/draft/silhouette.png')}
            />
          )}
          {renderPlayerInfo(player)}
        </View>
      </TouchableOpacity>
    );
  };

  const cornerStyles = [
    { borderTopRightRadius: 10, borderBottomLeftRadius: 10, borderTopLeftRadius: 10 },
    { borderTopRightRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10 },
    { borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderTopLeftRadius: 10 },
    { borderBottomRightRadius: 10, borderBottomLeftRadius: 10, borderTopRightRadius: 10 },
  ];

  const renderPickList = () => {
    const players = tierPlayerIds.map((id: string) => ({
      id,
      data: slatePlayers[id],
    }));

    const renderCard = (index: number) => {
      if (!players[index]?.data) return null;
      const player = players[index].data;
      const picked = player.picked;

      return (
        <View
          style={[
            styles.playerCardOuter,
            cornerStyles[index],
            picked
              ? { borderColor: 'rgb(200,210,226)', borderWidth: 1, backgroundColor: 'transparent' }
              : { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 3, height: 7 }, shadowOpacity: 0.2, shadowRadius: 7 },
          ]}
        >
          {renderPlayerCell(players[index].id)}
        </View>
      );
    };

    return (
      <View style={styles.pickListContainer}>
        <View style={styles.pickRow}>
          <View style={{ width: '50%', height: '100%', paddingLeft: 15, paddingRight: 5, paddingBottom: 5 }}>
            {renderCard(0)}
          </View>
          <View style={{ width: '50%', height: '100%', paddingLeft: 5, paddingRight: 15, paddingBottom: 5 }}>
            {renderCard(1)}
          </View>
        </View>
        <View style={{ height: 20 }} />
        <View style={[styles.pickRow, { minHeight: 131 }]}>
          <View style={{ width: '50%', height: '100%', minHeight: 131, paddingLeft: 15, paddingRight: 5, paddingTop: 5 }}>
            {renderCard(2)}
          </View>
          <View style={{ width: '50%', height: '100%', minHeight: 131, paddingLeft: 5, paddingRight: 15, paddingTop: 5 }}>
            {renderCard(3)}
          </View>
        </View>
      </View>
    );
  };

  // Opponent waiting view
  const renderWaiting = () => (
    <View style={styles.waitingContainer}>
      <Text style={styles.waitingText}>Opponent On</Text>
      <Text style={[styles.waitingText, { paddingBottom: 20 }]}>the clock</Text>
    </View>
  );

  // Scoring modal with actual tier data
  const renderScoringModal = () => (
    <Modal animationType="slide" transparent visible={showScoring}>
      <View style={styles.scoringModalContainer}>
        <TouchableOpacity style={styles.scoringModalHeader} onPress={() => setShowScoring(false)}>
          <Text style={styles.scoringModalHeaderText}>Back To Draft</Text>
        </TouchableOpacity>
        <ScrollView>
          <View style={{ paddingBottom: 100 }}>
            {currentTier?.scoring_system &&
              Object.keys(currentTier.scoring_system).map((key) => {
                const score = currentTier.scoring_system![key];
                return (
                  <View key={key} style={styles.scoringRow}>
                    <Text style={styles.scoringName}>{score.name}</Text>
                    <Text style={styles.scoringValue}>{score.score}</Text>
                  </View>
                );
              })}
            {!currentTier?.scoring_system && (
              <View style={styles.scoringRow}>
                <Text style={styles.scoringName}>
                  Each round, both players draft a player. The player with the higher score wins the round.
                  Win the most rounds to win the contest!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderScoringModal()}

      {/* Header with back button and round ribbon */}
      <View style={styles.headerBar}>
        <View style={{ height: insets.top + 50 }} />
        <View style={[styles.backButton, { top: insets.top + 5 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={[styles.roundsContainer, { top: insets.top }]}>
          {renderRounds()}
        </View>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{currentTier?.question || `Round ${draft.round}`}</Text>
      <TouchableOpacity style={styles.viewScoringButton} onPress={() => setShowScoring(true)}>
        <Text style={styles.viewScoringText}>View Scoring system</Text>
      </TouchableOpacity>

      {/* Player picks or waiting */}
      <View style={styles.mainContent}>
        {isUserTurn ? renderPickList() : renderWaiting()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          style={styles.footerAvatar}
          resizeMode="stretch"
          source={getAvatarUrl(getOnTheClockAvatar())}
        />
        <View style={styles.footerInfo}>
          <Text style={styles.footerWhosPick} numberOfLines={1}>{getWhosPick()}</Text>
          <Text style={styles.footerClock} numberOfLines={1} adjustsFontSizeToFit>{clock}</Text>
          <Text style={styles.footerPickText}>{getPickText()}</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity onPress={() => router.push('/(app)/compare-teams')}>
            <Image
              style={{ height: 34, width: 34 }}
              source={require('../../assets/images/draft/compareTeams.png')}
            />
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={getBackgroundColors()}
          style={styles.footerGradient}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignContent: 'flex-start',
    backgroundColor: 'rgb(239,247,255)',
  },

  // Header
  headerBar: {
    alignContent: 'flex-start',
    backgroundColor: 'rgb(6,14,43)',
  },
  backButton: {
    position: 'absolute',
    left: 15,
    zIndex: 999999,
  },
  roundsContainer: {
    width: 280,
    height: 55,
    flexDirection: 'row',
    zIndex: 9999,
    position: 'absolute',
    right: 20,
  },

  // Rounds
  round: {
    flex: 1,
    alignItems: 'center',
    zIndex: 99999,
  },
  roundLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 11,
    color: 'rgb(125,155,185)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  roundLabelSelected: {
    color: Colors.white,
  },
  roundCircles: {
    flexDirection: 'row',
    width: 25,
    height: 10,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgb(62,93,125)',
  },
  roundCircleSelected: {
    borderWidth: 2,
    borderColor: Colors.white,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgb(6,14,43)',
  },

  // Question
  questionText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxxl,
    textAlign: 'center',
    width: '100%',
    paddingTop: 10,
  },
  viewScoringButton: {
    width: '100%',
    paddingBottom: 10,
    paddingTop: 10,
  },
  viewScoringText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Pick list
  pickListContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgb(239,247,255)',
    justifyContent: 'center',
  },
  pickRow: {
    width: '100%',
    height: 200,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  playerCardOuter: {
    width: '100%',
    height: '100%',
  },

  // Player cell
  playerCell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerThumbnail: {
    width: 90,
    height: 90,
  },
  playerInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: 5,
  },
  playerName: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xl,
    color: Colors.black,
    textAlign: 'center',
    width: '100%',
  },
  playerKeyStat: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    color: Colors.black,
    textAlign: 'center',
  },
  playerPosition: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
    color: 'rgb(150,163,184)',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  pickedLabel: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 40,
    lineHeight: 40,
    position: 'relative',
    top: 3,
    color: 'rgb(195,211,237)',
    width: '100%',
    textAlign: 'center',
  },

  // Selected overlay (Cancel / Confirm)
  selectedOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cancelHalf: {
    width: '50%',
    height: '100%',
    backgroundColor: 'rgb(7,25,42)',
  },
  cancelButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  cancelText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
    color: 'rgba(255,255,255,0.3)',
  },
  confirmHalf: {
    width: '50%',
    height: '100%',
  },
  confirmButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  confirmText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
  },
  draftingOverlay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  draftingText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
  },

  // Waiting
  waitingContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 60,
    color: 'rgb(6,14,43)',
    textAlign: 'center',
    lineHeight: 55,
  },

  // Main content area
  mainContent: {
    width: '100%',
    backgroundColor: 'rgb(239,247,255)',
    flex: 1,
  },

  // Footer
  footer: {
    height: 123,
    width: '100%',
    flexDirection: 'row',
  },
  footerAvatar: {
    width: 92,
    height: 92,
    position: 'absolute',
    bottom: 15,
    left: 0,
    zIndex: 1,
  },
  footerInfo: {
    position: 'absolute',
    left: 95,
    bottom: 26,
    zIndex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  footerWhosPick: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xl,
    color: Colors.white,
    lineHeight: 20,
    paddingBottom: 2,
    width: 150,
  },
  footerClock: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 43,
    color: Colors.white,
    lineHeight: 43,
  },
  footerPickText: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: 19,
    lineHeight: 19,
    color: Colors.white,
  },
  footerActions: {
    height: 123,
    position: 'absolute',
    width: 77,
    bottom: 0,
    right: 0,
    zIndex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.13)',
  },
  footerGradient: {
    height: 123,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },

  // Draft completed
  draftCompleted: {
    flex: 1,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedAvatars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  completedAvatar: {
    width: 145,
    height: 145,
    zIndex: 1,
  },
  completedText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: 28,
    color: Colors.white,
  },
  confirmSelection: {
    backgroundColor: 'rgb(5,208,123)',
    borderRadius: 20,
    textAlign: 'center',
    width: 165,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSelectionText: {
    fontFamily: Fonts.vanguardBold,
    color: Colors.white,
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },

  // Scoring modal
  scoringModalContainer: {
    backgroundColor: Colors.white,
    width: '100%',
    height: '100%',
  },
  scoringModalHeader: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgb(6,14,43)',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  scoringModalHeaderText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxxl,
    textAlign: 'center',
    width: '100%',
    color: Colors.white,
  },
  scoringRow: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#DDDDDD',
    borderBottomWidth: 1,
  },
  scoringName: {
    textAlign: 'left',
    fontFamily: Fonts.vanguardRegular,
    fontSize: 14,
    letterSpacing: 1,
  },
  scoringValue: {
    textAlign: 'right',
    fontFamily: Fonts.vanguardRegular,
    fontSize: 14,
    letterSpacing: 1,
  },
});
