import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../src/services/firebase';
import { useAuthStore } from '../../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import type { CoinLedgerEntry } from '../../../src/types';

const COIN_PACKAGES = [
  { id: 'pack_100', amount: 100, price: '$0.99', icon: 'toll' as const, popular: false },
  { id: 'pack_500', amount: 500, price: '$3.99', icon: 'toll' as const, popular: true },
  { id: 'pack_1200', amount: 1200, price: '$7.99', icon: 'toll' as const, popular: false },
  { id: 'pack_3000', amount: 3000, price: '$14.99', icon: 'diamond' as const, popular: false },
];

const TX_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  entry_fee: { label: 'Entry Fee', icon: 'remove-circle', color: '#FF6B6B' },
  payout: { label: 'Win Payout', icon: 'emoji-events', color: '#4CAF50' },
  signup_bonus: { label: 'Signup Bonus', icon: 'card-giftcard', color: '#FFD700' },
  bonus: { label: 'Bonus Coins', icon: 'redeem', color: '#64B5F6' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CoinsScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const userData = useAuthStore((s) => s.userData);
  const [recentTx, setRecentTx] = useState<CoinLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    const ref = collection(firestore, 'USERS', authUser.uid, 'COIN_LEDGER');
    const q = query(ref, orderBy('created_at', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setRecentTx(snap.docs.map((d) => d.data() as CoinLedgerEntry));
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, [authUser?.uid]);

  const coins = userData?.coins ?? 0;

  const renderHeader = () => (
    <>
      {/* Balance */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceIconRow}>
          <MaterialIcons name="toll" size={36} color="#FFD700" />
        </View>
        <Text style={styles.balanceAmount}>{coins.toLocaleString()}</Text>
        <Text style={styles.balanceLabel}>Your Coins</Text>
      </View>

      {/* Coin Store */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="storefront" size={20} color={Colors.white} />
        <Text style={styles.sectionTitle}>COIN STORE</Text>
      </View>
      <View style={styles.storeGrid}>
        {COIN_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[styles.storeCard, pkg.popular && styles.storeCardPopular]}
            activeOpacity={0.7}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>BEST VALUE</Text>
              </View>
            )}
            <MaterialIcons name={pkg.icon} size={28} color="#FFD700" />
            <Text style={styles.storeAmount}>{pkg.amount.toLocaleString()}</Text>
            <Text style={styles.storeCoinsLabel}>coins</Text>
            <View style={styles.priceButton}>
              <Text style={styles.priceText}>{pkg.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* History Header */}
      <View style={styles.sectionHeader}>
        <MaterialIcons name="receipt-long" size={20} color={Colors.white} />
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => router.push('/coin-ledger')}
          style={styles.seeAllButton}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.primaryBlueLight} />
        </TouchableOpacity>
      </View>
    </>
  );

  const renderTxItem = ({ item }: { item: CoinLedgerEntry }) => {
    const config = TX_CONFIG[item.type] || TX_CONFIG.signup_bonus;
    const isPositive = item.amount > 0;

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: config.color + '22' }]}>
          <MaterialIcons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={styles.txContent}>
          <Text style={styles.txLabel}>{config.label}</Text>
          <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={[styles.txAmount, { color: isPositive ? '#4CAF50' : '#FF6B6B' }]}>
          {isPositive ? '+' : ''}{item.amount}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="account-balance-wallet" size={40} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyText}>No transactions yet</Text>
      <Text style={styles.emptySubText}>Join a contest to get started!</Text>
    </View>
  );

  return (
    <LinearGradient colors={['rgb(6,14,43)', 'rgb(7,25,42)']} style={styles.container}>
      <FlatList
        data={recentTx}
        keyExtractor={(item) => item.id}
        renderItem={renderTxItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={Colors.white} size="large" style={{ marginTop: 30 }} />
        ) : renderEmpty()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Balance
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 28,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
  },
  balanceIconRow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 52,
    color: '#FFD700',
    lineHeight: 56,
  },
  balanceLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.base,
    color: Colors.neutralMid,
    marginTop: 2,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
    letterSpacing: 2,
  },

  // Store
  storeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
  },
  storeCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  storeCardPopular: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 14,
  },
  popularText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.xs,
    color: Colors.backgroundDark,
    letterSpacing: 1,
  },
  storeAmount: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.title,
    color: Colors.white,
    marginTop: 6,
  },
  storeCoinsLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.sm,
    color: Colors.neutralMid,
    marginBottom: 10,
  },
  priceButton: {
    backgroundColor: Colors.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },

  // See all
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.md,
    color: Colors.primaryBlueLight,
  },

  // Transaction rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txContent: {
    flex: 1,
    marginLeft: 12,
  },
  txLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  txDate: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 30,
    gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.lg,
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: 'rgba(255,255,255,0.3)',
  },
});
