import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useContestStore } from '../stores/contestStore';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { useSlateStore } from '../stores/slateStore';
import SlateCard from './SlateCard';
import type { AvailableSlate } from '../types';

interface GameLobbyProps {
  onJoinSuccess?: () => void;
}

export default function GameLobby({ onJoinSuccess }: GameLobbyProps) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const authUser = useAuthStore((s) => s.user);
  const updateInvite = useContestStore((s) => s.updateInviteChallenge);
  const joinPublicContest = useContestStore((s) => s.joinPublicContest);
  const slates = useSlateStore((s) => s.slates);
  const slatesLoading = useSlateStore((s) => s.loading);

  const [selectedSlate, setSelectedSlate] = useState<AvailableSlate | null>(null);
  const [joining, setJoining] = useState(false);

  const incomingInvites = user?.incoming_invites as Record<string, any> | undefined;
  const outgoingInvites = user?.outgoing_invites as Record<string, any> | undefined;

  const handleSlatePress = (slate: AvailableSlate) => {
    setSelectedSlate(slate);
  };

  const handleRandomJoin = async () => {
    if (!authUser || !selectedSlate) return;
    setJoining(true);
    try {
      const result = await joinPublicContest(authUser.uid, selectedSlate.id, selectedSlate);
      if (result?.noop) {
        Alert.alert('Heads up', result.noop);
        setJoining(false);
        return;
      }
      if (result?.error) {
        Alert.alert('Error', result.error);
        setJoining(false);
        return;
      }
      setSelectedSlate(null);
      setJoining(false);
      onJoinSuccess?.();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to join. Try again.');
      setJoining(false);
    }
  };

  const handleSpecificOpponent = () => {
    if (!selectedSlate) return;
    setSelectedSlate(null);
    router.push({
      pathname: '/(app)/challenge/select',
      params: { slateId: selectedSlate.id, slateName: selectedSlate.name },
    });
  };

  const renderIncomeCell = (opponent: any) => (
    <View key={opponent.id} style={{ width: 320, height: 200 }}>
      <LinearGradient
        colors={['rgb(255,255,255)', 'rgb(187,216,255)']}
        style={styles.incomeCard}
      >
        <Image style={{ width: 100, height: 100 }} source={getAvatarUrl(opponent.avatar)} />
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.incomeCardName}>{opponent.display_name}</Text>
          <Text style={styles.incomeCardWager}>{opponent.wager}</Text>
          {opponent.slate_name && (
            <Text style={styles.incomeSlateName}>{opponent.slate_name}</Text>
          )}
        </View>
      </LinearGradient>
      <View style={styles.incomeCardActions}>
        <TouchableOpacity
          onPress={() => updateInvite(authUser!.uid, opponent.id, 'reject')}
          style={styles.incomeActionLeft}
        >
          <Image style={{ width: 25, height: 25 }} source={require('../../assets/images/play-tab/reject.png')} />
          <View style={{ width: 10 }} />
          <Text style={styles.incomeActionText}>REJECT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateInvite(authUser!.uid, opponent.id, 'accept')}
          style={styles.incomeActionRight}
        >
          <Image style={{ width: 25, height: 25 }} source={require('../../assets/images/play-tab/boltLeft.png')} />
          <View style={{ width: 10 }} />
          <Text style={styles.incomeActionText}>ACCEPT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutboundCell = (opponent: any) => (
    <View key={opponent.id} style={styles.outboundCell}>
      <Image style={{ width: 100, height: 100 }} source={getAvatarUrl(opponent.avatar)} />
      <View>
        <Text style={styles.outboundName}>{opponent.display_name}</Text>
        <Text style={styles.outboundWager}>{opponent.wager}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', paddingBottom: 120 }}
        bounces={false}
      >
        <View style={styles.slatesContainer}>
          {slatesLoading ? (
            <ActivityIndicator size="large" color={Colors.white} style={{ paddingVertical: 40 }} />
          ) : slates.length > 0 ? (
            slates.map((slate) => (
              <SlateCard key={slate.id} slate={slate} onPress={handleSlatePress} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={48} color="rgba(255,255,255,0.4)" />
              <Text style={styles.emptyText}>No slates available right now</Text>
              <Text style={styles.emptySubtext}>Check back soon for new matchups</Text>
            </View>
          )}
        </View>

        {incomingInvites && Object.keys(incomingInvites).length > 0 && (
          <View style={{ height: 280, width: '100%' }}>
            <Text style={styles.inviteSectionTitle}>
              {Object.keys(incomingInvites).length} Incoming Challenges
            </Text>
            <View style={{ paddingLeft: 20, width: '100%' }}>
              <ScrollView horizontal bounces={false}>
                {Object.keys(incomingInvites).map((key) => renderIncomeCell(incomingInvites[key]))}
              </ScrollView>
            </View>
          </View>
        )}

        {outgoingInvites && Object.keys(outgoingInvites).length > 0 && (
          <View style={{ width: '100%' }}>
            <Text style={styles.inviteSectionTitle}>
              {Object.keys(outgoingInvites).length} OUTBOUND Challenges
            </Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' }}>
              {Object.keys(outgoingInvites).map((key) => renderOutboundCell(outgoingInvites[key]))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selectedSlate}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSlate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedSlate(null)}
            >
              <MaterialIcons name="close" size={24} color={Colors.neutralMid} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{selectedSlate?.name}</Text>
            <Text style={styles.modalSport}>{selectedSlate?.sport.toUpperCase()}</Text>
            {selectedSlate?.description ? (
              <Text style={styles.modalDescription}>{selectedSlate.description}</Text>
            ) : null}

            <View style={styles.modalDivider} />
            <Text style={styles.modalQuestion}>How do you want to play?</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleRandomJoin}
              disabled={joining}
            >
              <LinearGradient
                colors={[Colors.primaryBlue, Colors.primaryBlueLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalOptionGradient}
              >
                {joining ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <MaterialIcons name="shuffle" size={26} color={Colors.white} />
                    <View style={styles.modalOptionTextWrap}>
                      <Text style={styles.modalOptionTitle}>Random Opponent</Text>
                      <Text style={styles.modalOptionSub}>Get matched with someone new</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={26} color="rgba(255,255,255,0.6)" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleSpecificOpponent}
            >
              <LinearGradient
                colors={[Colors.accentPurple, '#6A1B9A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalOptionGradient}
              >
                <MaterialIcons name="person-search" size={26} color={Colors.white} />
                <View style={styles.modalOptionTextWrap}>
                  <Text style={styles.modalOptionTitle}>Specific Opponent</Text>
                  <Text style={styles.modalOptionSub}>Challenge a friend or rival</Text>
                </View>
                <MaterialIcons name="chevron-right" size={26} color="rgba(255,255,255,0.6)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    flex: 1,
  },
  slatesContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
    color: Colors.white,
    paddingTop: 12,
  },
  emptySubtext: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.6)',
    paddingTop: 4,
  },
  inviteSectionTitle: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    color: Colors.white,
    paddingLeft: 20,
    paddingTop: 30,
    paddingBottom: 10,
    letterSpacing: 2,
  },
  incomeCard: {
    flexDirection: 'row',
    height: 150,
    width: 300,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  incomeCardName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.base,
    paddingBottom: 5,
  },
  incomeCardWager: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
  },
  incomeSlateName: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
    paddingTop: 4,
  },
  incomeCardActions: {
    height: 50,
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  incomeActionLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRightColor: '#C2DCFF',
    borderRightWidth: 1,
    width: '50%',
    height: '100%',
  },
  incomeActionRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '50%',
  },
  incomeActionText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
  },
  outboundCell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    borderBottomColor: 'rgb(158,203,255)',
    borderBottomWidth: 1,
  },
  outboundName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.base,
    paddingBottom: 20,
    color: Colors.white,
  },
  outboundWager: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: '88%',
    maxWidth: 400,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalTitle: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.xxl,
    textTransform: 'uppercase',
    paddingRight: 30,
  },
  modalSport: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.sm,
    color: Colors.primaryBlue,
    letterSpacing: 2,
    paddingTop: 4,
  },
  modalDescription: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.neutralMid,
    paddingTop: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Colors.neutralLight,
    marginVertical: 18,
  },
  modalQuestion: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    paddingBottom: 16,
  },
  modalOption: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  modalOptionTextWrap: {
    flex: 1,
  },
  modalOptionTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  modalOptionSub: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    paddingTop: 2,
  },
});
