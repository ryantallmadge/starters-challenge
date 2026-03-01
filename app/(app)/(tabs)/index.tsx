import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useContestStore } from '../../../src/stores/contestStore';
import { useUserStore } from '../../../src/stores/userStore';
import GameLobby from '../../../src/components/GameLobby';
import JoinedDrafts from '../../../src/components/JoinedDrafts';
import FullLoading from '../../../src/components/FullLoading';

const TABS = ['Lobby', 'My Drafts'] as const;

export default function PlayTab() {
  const [currentTab, setCurrentTab] = useState<string>(TABS[0]);
  const userContests = useContestStore((s) => s.userContests);
  const initialTabSet = useRef(false);

  useEffect(() => {
    if (initialTabSet.current || !userContests?.contests) return;
    initialTabSet.current = true;
    const hasDrafting = Object.values(userContests.contests).some(
      (c) => c.stage === 'draft'
    );
    if (hasDrafting) {
      setCurrentTab('My Drafts');
    }
  }, [userContests]);
  const user = useUserStore((s) => s.user);

  if (!userContests || !user) return <FullLoading />;

  return (
    <ImageBackground
      source={require('../../../assets/images/play-tab/funBlueBackground.png')}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Image
          style={styles.logo}
          source={require('../../../assets/images/starterslogo.png')}
        />
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const selected = currentTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setCurrentTab(tab)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {currentTab === 'Lobby' ? (
        <GameLobby onJoinSuccess={() => setCurrentTab('My Drafts')} />
      ) : (
        <JoinedDrafts />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  logo: {
    height: 70,
    width: 87,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 14,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: Colors.primaryBlueLink,
    borderColor: Colors.white,
  },
  tabText: {
    textAlign: 'center',
    fontFamily: Fonts.vanguardDemiBold,
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    includeFontPadding: false,
  },
  tabTextSelected: {
    color: Colors.white,
  },
});
