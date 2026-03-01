import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Fonts, FontSizes } from '../theme';
import getAvatarUrl from '../utils/getAvatarUrl';
import { useUserStore } from '../stores/userStore';
import { useContestStore } from '../stores/contestStore';

export default function LiveCard() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const userContests = useContestStore((s) => s.userContests);

  const activeContestId = useContestStore((s) => s.activeContestId);

  const current = activeContestId && userContests?.contests?.[activeContestId]
    ? userContests.contests[activeContestId] as any
    : null;

  if (!user || !current) return null;

  const opponent = current.oppenent;
  const wager = current.wager || 'Bragging Rights';

  const getRecord = () => {
    if (!opponent || !user.records) return '0-0';
    const record = (user.records as any)[opponent.id];
    return record ? `${record.wins}-${record.losses}` : '0-0';
  };

  const getScoreIcon = (roundIdx: number, isOpponent: boolean) => {
    if (!current.picks || !current.slate?.players) {
      return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/unfinishedRoundBlue.png')} />;
    }
    const userPick = current.picks[roundIdx];
    const oppPick = current.oppenent?.picks?.[roundIdx];
    if (!userPick || !oppPick) {
      return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/unfinishedRoundBlue.png')} />;
    }
    const userPlayer = current.slate.players[userPick];
    const oppPlayer = current.slate.players[oppPick];
    if (!userPlayer || !oppPlayer) {
      return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/unfinishedRoundBlue.png')} />;
    }

    const p = isOpponent ? userPlayer : oppPlayer;
    const o = isOpponent ? oppPlayer : userPlayer;
    const pScore = Number(p.score || 0);
    const oScore = Number(o.score || 0);

    if (o.scored && (oScore > pScore || (oScore === pScore && p.tie_breaker < o.tie_breaker))) {
      return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/greenCheck.png')} />;
    }
    if (p.scored && (oScore < pScore || (oScore === pScore && p.tie_breaker > o.tie_breaker))) {
      return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/failedRound.png')} />;
    }
    return <Image style={styles.pickIconImage} source={require('../../assets/images/live-card/unfinishedRoundBlue.png')} />;
  };

  const roundCount = current.draft?.order ? current.draft.order.length / 2 : 0;
  const rounds = Array.from({ length: roundCount }, (_, i) => i);

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 20 }}>
            <Text style={styles.cardTopText}>IN PROGRESS</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 20 }}>
            <Text style={styles.cardTopText}>Series Record {getRecord()}</Text>
          </View>
        </View>
        <LinearGradient
          colors={['rgb(0,128,255)', 'rgb(0,157,255)', 'rgb(0,128,255)', 'rgb(0,157,255)']}
          locations={[0, 0.5, 0.5, 1]}
          style={styles.cardMiddle}
        >
          <View style={styles.gameType}>
            <Text style={styles.gameTypeHeader}>This Game is For:</Text>
            <Text style={styles.gameTypeInfo} adjustsFontSizeToFit numberOfLines={1}>{wager}</Text>
          </View>
          <View style={styles.avatars}>
            <Image style={{ width: 145, height: 145 }} source={getAvatarUrl(user.avatar)} />
            <Image style={{ position: 'relative', top: 20 }} source={require('../../assets/images/play-tab/vsBlue.png')} />
            <Image style={{ width: 145, height: 145 }} source={getAvatarUrl(opponent?.avatar || '')} />
          </View>
          <View style={styles.roundsTable}>
            <View style={styles.roundsTableCell}><Text style={styles.roundsTableHeader}>{user.display_name}</Text></View>
            <View style={styles.roundsTableCell}><Text style={styles.roundsTableHeader}>Rounds</Text></View>
            <View style={styles.roundsTableCell}><Text style={styles.roundsTableHeader}>{opponent?.display_name}</Text></View>
          </View>
          {rounds.map((i) => (
            <View key={i} style={styles.roundsTable}>
              <View style={styles.roundsTableCell}>{getScoreIcon(i, false)}</View>
              <View style={styles.roundsTableCell}>
                <Text style={[styles.roundsTableHeader, { fontFamily: Fonts.vanguardMedium, fontSize: 16 }]}>{i + 1}</Text>
              </View>
              <View style={styles.roundsTableCell}>{getScoreIcon(i, true)}</View>
            </View>
          ))}
        </LinearGradient>
        <LinearGradient colors={['rgb(29,27,41)', 'rgb(36,58,85)']} style={styles.cardBottom}>
          <TouchableOpacity onPress={() => router.push('/(app)/live-scoring')}>
            <Text style={styles.cardBottomText}>SCORING</Text>
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
    backgroundColor: Colors.successGreen,
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
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardBottomText: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.vanguardBold,
    textTransform: 'uppercase',
    color: Colors.white,
    textAlign: 'center',
    width: '100%',
  },
  gameType: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  gameTypeHeader: { fontFamily: Fonts.vanguardMedium, fontSize: FontSizes.lg, color: Colors.white },
  gameTypeInfo: { fontFamily: Fonts.vanguardExtraBold, fontSize: FontSizes.display, color: Colors.white, paddingHorizontal: 10 },
  avatars: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  roundsTable: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%' },
  roundsTableHeader: { fontFamily: Fonts.robotoCondensedBold, fontSize: 14, color: Colors.white, textAlign: 'center' },
  roundsTableCell: { width: '33%', justifyContent: 'center', alignItems: 'center', paddingBottom: 7 },
  pickIconImage: { height: 20, width: 20 },
});
