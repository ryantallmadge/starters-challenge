import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes, Spacing } from '../../src/theme';
import { getAvatarSource, getAvatarName, avatarKeys } from '../../src/utils/avatarImages';
import WelcomeCelebration from '../../src/components/WelcomeCelebration';

export default function PickAvatarScreen() {
  const saveAvatar = useAuthStore((s) => s.saveAvatar);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleWelcomeFinish = useCallback(() => {
    setShowWelcome(false);
  }, []);

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
                currentAvatar === key && styles.selectAvatarSelected,
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
      <Text style={styles.title}>Choose Your Avatar</Text>

      <ImageBackground
        source={require('../../assets/images/pick-avatar/light.png')}
        style={styles.pickedAvatar}
      >
        {currentAvatar ? (
          <Image style={{ width: 145, height: 145 }} source={getAvatarSource(currentAvatar)} />
        ) : (
          <Image
            style={{ height: 145 }}
            source={require('../../assets/images/play-tab/mysteryPlayer.png')}
          />
        )}
      </ImageBackground>

      <Text style={styles.avatarName}>
        {currentAvatar ? getAvatarName(currentAvatar) : 'Select From Below'}
      </Text>

      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: currentAvatar ? 100 : 20 }}>{renderAvatarGrid()}</ScrollView>

      {currentAvatar && (
        <View style={styles.confirmBox}>
          <TouchableOpacity style={styles.cancelSelection} onPress={() => setCurrentAvatar(null)}>
            <Text style={styles.confirmSelectionText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmSelection}
            onPress={() => {
              saveAvatar(currentAvatar);
              setCurrentAvatar(null);
            }}
          >
            <Text style={styles.confirmSelectionText}>Confirm Pick</Text>
          </TouchableOpacity>
        </View>
      )}

      {showWelcome && <WelcomeCelebration onFinish={handleWelcomeFinish} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: FontSizes.title,
    fontFamily: Fonts.vanguardBold,
    bottom: -50,
  },
  pickedAvatar: {
    width: 164,
    height: 283,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  avatarName: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.hero,
    color: Colors.white,
    paddingTop: 10,
    paddingBottom: 10,
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
