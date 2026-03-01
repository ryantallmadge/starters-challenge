import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useUserStore } from '../stores/userStore';
import { useContestStore } from '../stores/contestStore';

export default function DraftCard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);

  const activeContestId = useContestStore((s) => s.activeContestId);
  const current = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;

  if (!user || !current) return null;

  const opponent = current.oppenent;
  const draft = current.draft;
  const wager = current.wager || 'Bragging Rights';

  const isUserTurn = draft?.on_the_clock === user.id;
  const bgColors = isUserTurn
    ? (['rgb(11,152,93)', 'rgb(75,242,172)', 'rgb(18,200,123)', 'rgb(75,242,172)'] as const)
    : (['rgb(0,128,255)', 'rgb(0,157,255)', 'rgb(0,128,255)', 'rgb(0,157,255)'] as const);
  const whosPick = isUserTurn ? "It's Your Pick" : `It's ${opponent?.display_name} Pick`;

  const getRecord = () => {
    if (!opponent || !user.records) return '0-0';
    const record = (user.records as any)[opponent.id];
    return record ? `${record.wins}-${record.losses}` : '0-0';
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 20 }}>
            <Text style={styles.cardTopText}>Drafting teams</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 20 }}>
            <Text style={styles.cardTopText}>Series Record {getRecord()}</Text>
          </View>
        </View>
        <LinearGradient colors={[...bgColors]} locations={[0, 0.5, 0.5, 1]} style={styles.cardMiddle}>
          <View style={styles.gameType}>
            <Text style={styles.gameTypeHeader}>
              ROUND {draft?.round} - PICK {(draft?.current_pick ?? 0) + 1}
            </Text>
            <Text style={styles.gameTypeInfo}>{whosPick}</Text>
          </View>
          <View style={styles.avatars}>
            <View>
              <Image style={{ width: 145, height: 145 }} source={getAvatarUrl(user.avatar)} />
              <Text style={styles.displayNameText}>{user.display_name}</Text>
            </View>
            <Image style={{ position: 'relative', top: 20 }} source={require('../../assets/images/play-tab/vsBlue.png')} />
            <View>
              <Image style={{ width: 145, height: 145 }} source={getAvatarUrl(opponent?.avatar || '')} />
              <Text style={styles.displayNameText}>{opponent?.display_name}</Text>
            </View>
          </View>
          <View style={styles.gameType}>
            <Text style={styles.gameTypeHeader}>This Game Is For:</Text>
            <Text style={styles.gameTypeInfo} adjustsFontSizeToFit numberOfLines={1}>{wager}</Text>
          </View>
        </LinearGradient>
        <LinearGradient colors={['rgb(29,27,41)', 'rgb(36,58,85)']} style={styles.cardBottom}>
          <TouchableOpacity onPress={() => router.push('/(app)/draft')}>
            <Text style={styles.cardBottomText}>enter draft room</Text>
          </TouchableOpacity>
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cardTop: {
    width: '100%',
    height: 30,
    backgroundColor: Colors.accentOrange,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTopText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.arnoldSans,
    textTransform: 'uppercase',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cardMiddle: { height: 430 },
  cardBottom: {
    width: '100%',
    height: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBottomText: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.vanguardBold,
    textTransform: 'uppercase',
    color: Colors.white,
  },
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  displayNameText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    paddingTop: 13,
  },
});
