import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useUserStore } from '../../../src/stores/userStore';
import { useLeaderboardStore } from '../../../src/stores/leaderboardStore';
import getAvatarUrl from '../../../src/utils/getAvatarUrl';
import type { LeaderboardEntry } from '../../../src/types';

export default function ChallengeSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slateId?: string; slateName?: string }>();
  const [searchText, setSearchText] = useState('');
  const searchResults = useUserStore((s) => s.searchResults);
  const searchUsersAction = useUserStore((s) => s.searchUsers);
  const leaderboard = useLeaderboardStore((s) => s.leaderboard);

  useEffect(() => {
    if (searchText.length > 1) {
      searchUsersAction(searchText);
    } else {
      searchUsersAction(null);
    }
  }, [searchText]);

  const selectOpponent = (opponent: any) => {
    router.push({
      pathname: '/(app)/challenge/wager',
      params: {
        opponentId: opponent.id || opponent.user?.id,
        opponentName: opponent.display_name || opponent.user?.display_name,
        opponentAvatar: opponent.avatar || opponent.user?.avatar,
        slateId: params.slateId,
        slateName: params.slateName,
      },
    });
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <TouchableOpacity style={styles.leaderRow} onPress={() => selectOpponent(item)}>
      <Image style={styles.leaderAvatar} source={getAvatarUrl(item.user.avatar)} />
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{item.user.display_name}</Text>
        <Text style={styles.leaderRecord}>
          {item.record ? `${item.record.wins}-${item.record.losses}` : '0-0'}
        </Text>
      </View>
      <TouchableOpacity style={styles.challengeButton} onPress={() => selectOpponent(item)}>
        <Text style={styles.challengeButtonText}>Challenge</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.leaderRow} onPress={() => selectOpponent(item)}>
      <Image style={styles.leaderAvatar} source={getAvatarUrl(item.avatar)} />
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{item.display_name}</Text>
      </View>
      <TouchableOpacity style={styles.challengeButton} onPress={() => selectOpponent(item)}>
        <Text style={styles.challengeButtonText}>Challenge</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={30} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Opponent</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a player..."
            placeholderTextColor={Colors.grey}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
        </View>
      </LinearGradient>

      {searchText.length > 1 && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => item.user.id}
          style={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>All Opponents</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundLight },
  header: {
    width: '100%',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: { position: 'absolute', left: 20, top: 50, zIndex: 10 },
  headerTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xxl,
    color: Colors.white,
    textAlign: 'center',
    paddingBottom: 15,
  },
  searchContainer: { width: '100%', paddingTop: 10 },
  searchInput: {
    width: '100%',
    height: 45,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: FontSizes.base,
    color: Colors.black,
  },
  sectionTitle: {
    fontFamily: Fonts.vanguardMedium,
    fontSize: FontSizes.base,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: Colors.neutralMid,
  },
  list: { flex: 1 },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomColor: Colors.neutralLight,
    borderBottomWidth: 1,
  },
  leaderAvatar: { width: 50, height: 50, borderRadius: 25 },
  leaderInfo: { flex: 1, paddingLeft: 12 },
  leaderName: { fontFamily: Fonts.robotoCondensedBold, fontSize: FontSizes.base },
  leaderRecord: { fontFamily: Fonts.robotoCondensedRegular, fontSize: FontSizes.sm, color: Colors.neutralMid },
  challengeButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  challengeButtonText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.md,
    color: Colors.white,
    textTransform: 'uppercase',
  },
});
