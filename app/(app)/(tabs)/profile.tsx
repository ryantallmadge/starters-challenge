import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontSizes, Spacing } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUserStore } from '../../../src/stores/userStore';
import { useLeaderboardStore } from '../../../src/stores/leaderboardStore';
import { getAvatarSource, avatarKeys } from '../../../src/utils/avatarImages';

const TABS = ['Coins', 'Update Avatar'] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const authUser = useAuthStore((s) => s.user);
  const saveAvatar = useAuthStore((s) => s.saveAvatar);
  const userData = useAuthStore((s) => s.userData);
  const user = useUserStore((s) => s.user);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const leaderboard = useLeaderboardStore((s) => s.leaderboard);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return null;

  let leaderIndex = 1;
  leaderboard.find((leader, index) => {
    leaderIndex = index + 1;
    return leader.user.id === authUser?.uid;
  });

  const currentUser = leaderboard.find((l) => l.user.id === authUser?.uid);
  const wins = currentUser?.record?.wins ?? 0;
  const losses = currentUser?.record?.losses ?? 0;

  const renderAvatarGrid = () => {
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < avatarKeys.length; i += 3) {
      const rowItems = avatarKeys.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.avatarRow}>
          {rowItems.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.selectAvatar,
                (currentAvatar === key || user.avatar === key) && styles.selectAvatarSelected,
              ]}
              onPress={() => setCurrentAvatar(key)}
            >
              <Image style={{ width: 145, height: 145 }} source={getAvatarSource(key)} />
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.container}>
      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Hero */}
      <ImageBackground
        source={require('../../../assets/images/pick-avatar/light.png')}
        style={styles.pickedAvatar}
      >
        <Image
          style={styles.avatar}
          source={getAvatarSource(currentAvatar || user.avatar)}
        />
      </ImageBackground>

      <Text style={styles.avatarName}>{user.display_name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{wins}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{losses}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{leaderIndex}</Text>
          <Text style={styles.statLabel}>Leaderboard</Text>
        </View>
      </View>

      {/* Tab Row */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === 'Coins' ? (
        <View style={styles.tabContent}>
          <View style={styles.coinCard}>
            <View style={styles.coinCardTop}>
              <View style={styles.coinIconCircle}>
                <MaterialIcons name="toll" size={32} color="#FFD700" />
              </View>
              <View style={styles.coinCardInfo}>
                <Text style={styles.coinAmount}>{(userData?.coins ?? 0).toLocaleString()}</Text>
                <Text style={styles.coinLabel}>Coins</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() => router.push('/coin-ledger')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="receipt-long" size={18} color={Colors.white} />
              <Text style={styles.viewHistoryText}>View History</Text>
              <View style={{ flex: 1 }} />
              <MaterialIcons name="chevron-right" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.avatarScrollArea} contentContainerStyle={styles.avatarScrollContent}>
          {renderAvatarGrid()}
        </ScrollView>
      )}

      {/* Avatar Confirm Bar */}
      {currentAvatar && activeTab === 'Update Avatar' && (
        <View style={styles.confirmBox}>
          <TouchableOpacity style={styles.cancelSelection} onPress={() => setCurrentAvatar(null)}>
            <Text style={styles.confirmSelectionText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmSelection}
            onPress={async () => {
              await saveAvatar(currentAvatar);
              if (authUser) await fetchUser(authUser.uid);
              setCurrentAvatar(null);
            }}
          >
            <Text style={styles.confirmSelectionText}>Confirm Pick</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* User ID */}
      <Text style={styles.userId}>ID: {authUser?.uid}</Text>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                <Text style={styles.modalButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  avatar: { width: Spacing.avatarXL, height: Spacing.avatarXL },
  logoutButton: { position: 'absolute', top: 60, right: 20, zIndex: 10 },
  logoutButtonText: {
    fontFamily: Fonts.vanguardDemiBold,
    fontSize: FontSizes.xl,
    color: Colors.white,
  },
  pickedAvatar: {
    width: 164,
    height: 283,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 40,
  },
  avatarName: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.hero,
    color: Colors.white,
    paddingTop: 10,
    paddingBottom: 2,
  },
  email: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.recordsLabel,
    paddingBottom: 8,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.title,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    color: Colors.recordsLabel,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: Colors.primaryBlueLink,
    borderColor: Colors.white,
  },
  tabText: {
    textAlign: 'center',
    fontFamily: Fonts.vanguardDemiBold,
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    includeFontPadding: false,
  },
  tabTextSelected: {
    color: Colors.white,
  },

  // Tab content
  tabContent: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },

  // Coins card
  coinCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 20,
  },
  coinCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCardInfo: {
    marginLeft: 16,
  },
  coinAmount: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 40,
    color: '#FFD700',
    lineHeight: 44,
  },
  coinLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.recordsLabel,
    marginTop: 2,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  viewHistoryText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },

  // Avatar grid
  avatarScrollArea: {
    flex: 1,
    width: '100%',
  },
  avatarScrollContent: {
    paddingBottom: 140,
  },
  avatarRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  selectAvatar: {
    height: Spacing.avatarMedium,
    width: Spacing.avatarMedium,
    borderRadius: 5,
    backgroundColor: Colors.avatarBlueBg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  selectAvatarSelected: {
    backgroundColor: Colors.white,
    borderColor: Colors.successGreenCyan,
    borderWidth: 6,
  },

  // Confirm bar
  confirmBox: {
    height: 85,
    width: '100%',
    position: 'absolute',
    backgroundColor: Colors.black,
    zIndex: 999999,
    bottom: 110,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 16,
  },
  cancelSelection: {
    backgroundColor: Colors.cancelGrey,
    borderRadius: Spacing.borderRadiusXl,
    width: 165,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSelection: {
    backgroundColor: Colors.successGreen,
    borderRadius: Spacing.borderRadiusLg,
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

  userId: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.3)',
    paddingVertical: 8,
  },

  // Logout modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.xxl,
    color: Colors.backgroundDark,
    marginBottom: 8,
  },
  modalText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.base,
    color: Colors.neutralMid,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    backgroundColor: Colors.cancelGrey,
    borderRadius: Spacing.borderRadiusLg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: Colors.accentOrange,
    borderRadius: Spacing.borderRadiusLg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
});
