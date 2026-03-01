import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Image, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Fonts, FontSizes } from '../../../src/theme';
import { useContestStore } from '../../../src/stores/contestStore';
import { useUserStore } from '../../../src/stores/userStore';
import GameLobby from '../../../src/components/GameLobby';
import JoinedDrafts from '../../../src/components/JoinedDrafts';
import History from '../../../src/components/History';
import FullLoading from '../../../src/components/FullLoading';

const TABS = ['Lobby', 'My Drafts', 'History'] as const;

const TIMING_CONFIG = { duration: 300, easing: Easing.out(Easing.cubic) };

export default function PlayTab() {
  const [currentTab, setCurrentTab] = useState<string>(TABS[0]);
  const userContests = useContestStore((s) => s.userContests);
  const initialTabSet = useRef(false);

  const tabLayouts = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const pillX = useSharedValue(0);
  const pillY = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);
  const hasInitialLayout = useRef(false);

  const animatePill = useCallback((tab: string) => {
    const layout = tabLayouts.current[tab];
    if (!layout) return;
    pillX.value = withTiming(layout.x, TIMING_CONFIG);
    pillY.value = withTiming(layout.y, TIMING_CONFIG);
    pillWidth.value = withTiming(layout.width, TIMING_CONFIG);
    pillHeight.value = withTiming(layout.height, TIMING_CONFIG);
  }, [pillX, pillY, pillWidth, pillHeight]);

  const handleTabLayout = useCallback((tab: string, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    tabLayouts.current[tab] = { x, y, width, height };
    if (tab === currentTab) {
      if (!hasInitialLayout.current) {
        pillX.value = x;
        pillY.value = y;
        pillWidth.value = width;
        pillHeight.value = height;
        hasInitialLayout.current = true;
      } else {
        animatePill(tab);
      }
    }
  }, [currentTab, pillX, pillY, pillWidth, pillHeight, animatePill]);

  const handleTabPress = useCallback((tab: string) => {
    setCurrentTab(tab);
    animatePill(tab);
  }, [animatePill]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }, { translateY: pillY.value }],
    width: pillWidth.value,
    height: pillHeight.value,
  }));

  useEffect(() => {
    if (initialTabSet.current || !userContests?.contests) return;
    initialTabSet.current = true;
    const hasDrafting = Object.values(userContests.contests).some(
      (c) => c.stage === 'draft'
    );
    if (hasDrafting) {
      setCurrentTab('My Drafts');
      animatePill('My Drafts');
    }
  }, [userContests, animatePill]);
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
          <Animated.View style={[styles.pillIndicator, pillStyle]} />
          {TABS.map((tab) => {
            const selected = currentTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabPress(tab)}
                onLayout={(e) => handleTabLayout(tab, e)}
                style={styles.tab}
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
      ) : currentTab === 'My Drafts' ? (
        <JoinedDrafts />
      ) : (
        <History />
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
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 14,
    flex: 1,
  },
  pillIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.primaryBlueLink,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
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
