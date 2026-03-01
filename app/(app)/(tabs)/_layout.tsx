import { Tabs } from 'expo-router';
import { Image, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
        size={28}
        color={focused ? '#FFD700' : Colors.neutralTabUnselected}
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryBlueLink,
        tabBarInactiveTintColor: Colors.neutralTabUnselected,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lobby',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name="stadium"
              size={28}
              color={focused ? Colors.primaryBlueLink : Colors.neutralTabUnselected}
            />
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
    backgroundColor: Colors.white,
    height: 90,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: -3 },
    shadowColor: Colors.neutralShadow,
    shadowOpacity: 0.22,
    borderTopWidth: 0,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: Fonts.robotoCondensedBold,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    paddingTop: 8,
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
