import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getAvatarSource, avatarKeys } from '../utils/avatarImages';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 72;
const AVATAR_GAP = 14;
const ITEM_WIDTH = AVATAR_SIZE + AVATAR_GAP;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MarqueeRowProps {
  keys: string[];
  reverse?: boolean;
  speed?: number;
}

function MarqueeRow({ keys, reverse = false, speed = 40000 }: MarqueeRowProps) {
  const doubled = useMemo(() => [...keys, ...keys], [keys]);
  const stripWidth = keys.length * ITEM_WIDTH;

  const offset = useSharedValue(reverse ? -stripWidth : 0);

  useEffect(() => {
    offset.value = reverse ? -stripWidth : 0;
    offset.value = withRepeat(
      withTiming(reverse ? 0 : -stripWidth, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [offset, reverse, speed, stripWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Animated.View style={[styles.row, animStyle]}>
      {doubled.map((key, i) => (
        <View key={`${key}-${i}`} style={styles.avatarWrap}>
          <Image source={getAvatarSource(key)} style={styles.avatar} />
        </View>
      ))}
    </Animated.View>
  );
}

interface FloatingAvatarMarqueeProps {
  opacity?: number;
}

export default function FloatingAvatarMarquee({ opacity = 0.12 }: FloatingAvatarMarqueeProps) {
  const row1Keys = useMemo(() => shuffle(avatarKeys).slice(0, 14), []);
  const row2Keys = useMemo(() => shuffle(avatarKeys).slice(0, 14), []);

  return (
    <View style={[styles.container, { opacity }]} pointerEvents="none">
      <MarqueeRow keys={row1Keys} speed={35000} />
      <MarqueeRow keys={row2Keys} reverse speed={45000} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AVATAR_GAP,
  },
  avatar: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    resizeMode: 'contain',
  },
});
