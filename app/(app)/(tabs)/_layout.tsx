import { Tabs } from 'expo-router';
import { Image, Platform, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useAuthStore } from '../../../src/stores/authStore';

const tabIcons = {
  profile: {
    selected: require('../../../assets/images/tab-icons/profileSelected.png'),
    unselected: require('../../../assets/images/tab-icons/profileUnselected.png'),
  },
};

function CoinTabIcon({ focused }: { focused: boolean }) {
  const coins = useAuthStore((s) => s.userData?.coins ?? 0);

  return (
    <View style={styles.coinIconContainer}>
      <MaterialIcons
        name="toll"
        size={26}
        color={focused ? '#FFD700' : Colors.neutralMid}
      />
      <View style={[styles.coinBadge, focused && styles.coinBadgeFocused]}>
        <Text style={[styles.coinBadgeText, focused && styles.coinBadgeTextFocused]}>
          {coins >= 10000 ? `${(coins / 1000).toFixed(0)}k` : coins.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { bottom: bottomOffset },
        ],
        tabBarActiveTintColor: Colors.primaryBlueLink,
        tabBarInactiveTintColor: Colors.neutralMid,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lobby',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="stadium" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coins"
        options={{
          title: 'Coins',
          tabBarIcon: ({ focused }) => <CoinTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image source={focused ? tabIcons.profile.selected : tabIcons.profile.unselected} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    marginHorizontal: 40,
    height: 68,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 0,
    ...Platform.select({
      android: { paddingBottom: 0 },
    }),
  },
  tabBarItem: {
    paddingVertical: 8,
  },
  tabLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  coinIconContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  coinBadge: {
    position: 'absolute',
    top: -2,
    right: -22,
    backgroundColor: Colors.neutralTabUnselected,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  coinBadgeFocused: {
    backgroundColor: '#FFD700',
  },
  coinBadgeText: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: 11,
    color: Colors.white,
  },
  coinBadgeTextFocused: {
    color: Colors.backgroundDark,
  },
});
