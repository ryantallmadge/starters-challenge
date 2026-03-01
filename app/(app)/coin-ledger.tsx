import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../src/services/firebase';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Fonts, FontSizes } from '../../src/theme';
import type { CoinLedgerEntry } from '../../src/types';

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
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
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CoinLedgerScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const userData = useAuthStore((s) => s.userData);
  const [entries, setEntries] = useState<CoinLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    const ref = collection(firestore, 'USERS', authUser.uid, 'COIN_LEDGER');
    const q = query(ref, orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => d.data() as CoinLedgerEntry));
      setLoading(false);
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, [authUser?.uid]);

  const renderItem = ({ item }: { item: CoinLedgerEntry }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.signup_bonus;
    const isPositive = item.amount > 0;

    return (
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '22' }]}>
          <MaterialIcons name={config.icon as any} size={22} color={config.color} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{config.label}</Text>
          <Text style={styles.rowDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, { color: isPositive ? '#4CAF50' : '#FF6B6B' }]}>
            {isPositive ? '+' : ''}{item.amount}
          </Text>
          <Text style={styles.rowBalance}>Bal: {item.balance_after}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['rgb(6,14,43)', 'rgb(7,25,42)']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COIN LEDGER</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.balanceCard}>
        <MaterialIcons name="toll" size={32} color="#FFD700" />
        <Text style={styles.balanceAmount}>{userData?.coins ?? 0}</Text>
        <Text style={styles.balanceLabel}>Current Balance</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.white} size="large" style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="account-balance-wallet" size={48} color={Colors.neutralMid} />
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: FontSizes.xl,
    color: Colors.white,
    letterSpacing: 2,
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  balanceAmount: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 48,
    color: '#FFD700',
    marginTop: 4,
  },
  balanceLabel: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.md,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.base,
    color: Colors.white,
  },
  rowDate: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    fontFamily: Fonts.vanguardBold,
    fontSize: FontSizes.lg,
  },
  rowBalance: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.xs,
    color: Colors.neutralMid,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.lg,
    color: Colors.neutralMid,
  },
});
