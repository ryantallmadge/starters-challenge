import React, { useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Linking, RefreshControl } from 'react-native';
import { Colors, Fonts, FontSizes } from '../theme';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import type { PrizeData } from '../types';

export default function Wallet() {
  const authUser = useAuthStore((s) => s.user);
  const userPrizes = useUserStore((s) => s.userPrizes);
  const fetchUserPrizes = useUserStore((s) => s.fetchUserPrizes);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (authUser) fetchUserPrizes(authUser.uid);
  }, [authUser?.uid]);

  const onRefresh = useCallback(async () => {
    if (!authUser) return;
    setRefreshing(true);
    await fetchUserPrizes(authUser.uid);
    setRefreshing(false);
  }, [authUser?.uid]);

  const renderItem = ({ item }: { item: PrizeData }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => item.url && Linking.openURL(item.url)}
    >
      <Image
        style={styles.giftCardImage}
        source={require('../../assets/images/play-tab/amazonGiftCard.png')}
        resizeMode="contain"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.amountText}>{item.amount || 'Gift Card'}</Text>
        <Text style={styles.redeemText}>{item.redeemed ? 'Redeemed' : 'Tap to Redeem'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (userPrizes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No prizes yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={userPrizes}
      renderItem={renderItem}
      keyExtractor={(item, idx) => item.id || String(idx)}
      style={styles.list}
      contentContainerStyle={{ paddingBottom: 20 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, width: '100%', paddingHorizontal: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: Fonts.vanguardMedium, fontSize: FontSizes.lg, color: Colors.neutralMid },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  giftCardImage: { width: 80, height: 50 },
  cardInfo: { marginLeft: 15 },
  amountText: { fontFamily: Fonts.vanguardBold, fontSize: FontSizes.xxl },
  redeemText: { fontFamily: Fonts.robotoCondensedRegular, fontSize: FontSizes.md, color: Colors.primaryBlue, paddingTop: 4 },
});
