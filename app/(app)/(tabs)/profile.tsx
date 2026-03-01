import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontSizes, Spacing } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/authStore';
import { useUserStore } from '../../../src/stores/userStore';
import { useLeaderboardStore } from '../../../src/stores/leaderboardStore';
import { getAvatarSource, avatarKeys } from '../../../src/utils/avatarImages';

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

  if (!user) return null;

  let leaderIndex = 1;
  leaderboard.find((leader, index) => {
    leaderIndex = index + 1;
    return leader.user.id === authUser?.uid;
  });

  const getRecord = () => {
    const currentUser = leaderboard.find((l) => l.user.id === authUser?.uid);
    if (!currentUser?.record) return '0-0';
    return `${currentUser.record.wins}-${currentUser.record.losses}`;
  };

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
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

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

      <View style={styles.achievements}>
        <View style={styles.achievementNumbers}>
          <Text style={styles.achievementUnlocked}>Avatars Unlocked</Text>
          <Text style={[styles.achievementNumbersText, { textAlign: 'right' }]}>
            <Text style={styles.achievementNumbersTextWhite}>{avatarKeys.length}</Text>/{avatarKeys.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressBarInner, { width: '100%' }]} />
        </View>
      </View>

      <View style={styles.records}>
        <View>
          <Text style={styles.recordsNumber}>{getRecord()}</Text>
          <Text style={styles.recordsLabel}>Record</Text>
        </View>
        <View>
          <Text style={styles.recordsNumber}>{leaderIndex} / {leaderboard.length}</Text>
          <Text style={styles.recordsLabel}>Leaderboard</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.coinBar}
        onPress={() => router.push('/coin-ledger')}
        activeOpacity={0.7}
      >
        <MaterialIcons name="toll" size={22} color="#FFD700" />
        <Text style={styles.coinBarAmount}>{userData?.coins ?? 0}</Text>
        <Text style={styles.coinBarLabel}>Coins</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.coinBarAction}>View History</Text>
        <MaterialIcons name="chevron-right" size={20} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView style={{ flex: 1, width: '100%' }}>{renderAvatarGrid()}</ScrollView>

      {currentAvatar && (
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
  logoutButtonText: { fontFamily: Fonts.vanguardDemiBold, fontSize: FontSizes.xl, color: Colors.white },
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
    paddingBottom: 10,
  },
  achievements: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  achievementUnlocked: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
  achievementNumbers: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  achievementNumbersTextWhite: { color: Colors.white },
  achievementNumbersText: {
    fontFamily: Fonts.vanguardMedium,
    color: Colors.leaderboardAchievement,
    fontSize: FontSizes.lg,
  },
  progressBar: {
    width: '100%',
    height: 13,
    borderRadius: 8.5,
    backgroundColor: Colors.progressBarBg,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: 13,
    borderTopRightRadius: 8.5,
    borderBottomRightRadius: 8.5,
    backgroundColor: Colors.progressBarFill,
  },
  records: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 5,
  },
  recordsNumber: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxxl,
    color: Colors.white,
    textAlign: 'center',
  },
  recordsLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    color: Colors.recordsLabel,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  coinBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  coinBarAmount: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xl,
    color: '#FFD700',
  },
  coinBarLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.recordsLabel,
  },
  coinBarAction: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
    letterSpacing: 0.5,
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
  confirmBox: {
    height: 85,
    width: '100%',
    position: 'absolute',
    backgroundColor: Colors.black,
    zIndex: 999999,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
});
