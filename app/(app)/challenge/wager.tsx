import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, Spacing } from '../../../src/theme';
import { useContestStore } from '../../../src/stores/contestStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUserStore } from '../../../src/stores/userStore';
import getAvatarUrl from '../../../src/utils/getAvatarUrl';

export default function ChallengeWagerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    opponentId: string;
    opponentName: string;
    opponentAvatar: string;
    slateId?: string;
    slateName?: string;
  }>();
  const authUser = useAuthStore((s) => s.user);
  const user = useUserStore((s) => s.user);
  const sendInvite = useContestStore((s) => s.sendInviteChallenge);
  const [wager, setWager] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendChallenge = async () => {
    if (!authUser || !params.opponentId) return;
    await sendInvite(
      authUser.uid,
      params.opponentId,
      wager || 'Bragging Rights',
      params.slateId,
      params.slateName
    );
    setShowConfirm(false);
    router.dismissAll();
    router.replace('/(app)/(tabs)');
  };

  return (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <Text style={styles.header}>Matchup</Text>

        <View style={styles.avatarsContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={getAvatarUrl(user?.avatar || 'coach')}
            />
            <Text style={styles.avatarName}>{user?.display_name}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={getAvatarUrl(params.opponentAvatar || '')}
            />
            <Text style={styles.avatarName}>{params.opponentName}</Text>
          </View>
        </View>

        <Text style={styles.wagerLabel}>What's on the line?</Text>
        <TextInput
          style={styles.wagerInput}
          placeholder="Bragging Rights"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={wager}
          onChangeText={setWager}
        />

        <TouchableOpacity style={styles.sendButton} onPress={() => setShowConfirm(true)}>
          <Image
            source={require('../../../assets/images/challenge/sendChallenge.png')}
            style={styles.sendButtonImage}
            resizeMode="contain"
          />
          <Text style={styles.sendButtonText}>Send Challenge</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Challenge</Text>
            <Text style={styles.modalText}>
              Send challenge to {params.opponentName} for "{wager || 'Bragging Rights'}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleSendChallenge}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { position: 'absolute', left: 20, top: 50, zIndex: 10 },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  header: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.hero,
    color: Colors.white,
    paddingBottom: 30,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: 40,
  },
  avatarWrapper: { alignItems: 'center', width: 120 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarName: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.md,
    color: Colors.white,
    textAlign: 'center',
    paddingTop: 8,
  },
  vsText: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.xxxl,
    color: Colors.white,
    marginHorizontal: 15,
  },
  wagerLabel: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.lg,
    color: Colors.white,
    paddingBottom: 10,
  },
  wagerInput: {
    width: '100%',
    height: 50,
    borderBottomColor: Colors.white,
    borderBottomWidth: 2,
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.vanguardBold,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 40,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonImage: { width: 60, height: 60, marginBottom: 10 },
  sendButtonText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    color: Colors.white,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    paddingBottom: 15,
  },
  modalText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.base,
    textAlign: 'center',
    paddingBottom: 25,
    color: Colors.neutralMid,
  },
  modalActions: { flexDirection: 'row', gap: 15 },
  modalCancel: {
    backgroundColor: Colors.cancelGrey,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  modalCancelText: { fontFamily: Fonts.vanguardBold, color: Colors.white, fontSize: FontSizes.base },
  modalConfirm: {
    backgroundColor: Colors.successGreen,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  modalConfirmText: { fontFamily: Fonts.vanguardBold, color: Colors.white, fontSize: FontSizes.base },
});
