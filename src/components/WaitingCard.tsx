import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useUserStore } from '../stores/userStore';

export default function WaitingCard() {
  const user = useUserStore((s) => s.user);

  if (!user) return null;

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, alignItems: 'center', paddingLeft: 20 }}>
            <Text style={styles.cardTopText}>WAITING ON OPPONENT</Text>
          </View>
        </View>
        <LinearGradient
          colors={['rgb(0,128,255)', 'rgb(0,157,255)', 'rgb(0,128,255)', 'rgb(0,157,255)']}
          locations={[0, 0.5, 0.5, 1]}
          style={styles.cardMiddle}
        >
          <View style={styles.gameType}>
            <Text style={styles.gameTypeHeader}>The Draft Starts</Text>
            <Text style={styles.gameTypeInfo}>When OPPONENT joins</Text>
          </View>
          <View style={styles.avatars}>
            <View>
              <Image style={{ width: 135, height: 165 }} source={getAvatarUrl(user.avatar)} />
              <Text style={styles.displayNameText}>{user.display_name}</Text>
            </View>
            <Image
              style={{ position: 'relative', top: 50 }}
              source={require('../../assets/images/play-tab/vsBlue.png')}
            />
            <View>
              <Image
                style={{ width: 135, height: 155 }}
                resizeMode="contain"
                source={require('../../assets/images/play-tab/mysteryPlayer.png')}
              />
              <Text style={styles.displayNameText}>...</Text>
            </View>
          </View>
          <View style={[styles.gameType, { paddingTop: 30 }]}>
            <Text style={styles.gameTypeHeader}>Waiting for opponent</Text>
            <Text style={styles.gameTypeInfo}>Who's it going to be?</Text>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, width: '100%' },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    height: 520,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cardTop: {
    width: '100%',
    height: 30,
    backgroundColor: Colors.accentPurple,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  cardTopText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.arnoldSans,
    textTransform: 'uppercase',
    color: Colors.white,
    letterSpacing: 0.5,
    textAlign: 'left',
    width: '100%',
  },
  cardMiddle: { height: 530 },
  gameType: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  gameTypeHeader: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
  gameTypeInfo: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.display,
    color: Colors.white,
  },
  avatars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 40,
  },
  displayNameText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    paddingTop: 13,
  },
});
