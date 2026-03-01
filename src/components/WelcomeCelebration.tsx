import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';
import { getAvatarSource, avatarKeys } from '../utils/avatarImages';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const AVATAR_POSITIONS = [
  { top: '12%', left: '5%', size: 64, delay: 400 },
  { top: '10%', right: '8%', size: 58, delay: 550 },
  { top: '28%', left: '72%', size: 52, delay: 700 },
  { top: '25%', left: '2%', size: 48, delay: 650 },
  { bottom: '28%', left: '6%', size: 56, delay: 500 },
  { bottom: '25%', right: '5%', size: 60, delay: 600 },
  { bottom: '12%', left: '15%', size: 50, delay: 750 },
  { bottom: '14%', right: '18%', size: 54, delay: 450 },
] as const;

interface BouncingAvatarProps {
  avatarKey: string;
  size: number;
  delay: number;
  style: Record<string, any>;
}

function BouncingAvatar({ avatarKey, size, delay, style }: BouncingAvatarProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-15 + Math.random() * 30);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 8, stiffness: 120 }),
    );
    rotate.value = withDelay(
      delay,
      withSequence(
        withTiming(rotate.value + 10, { duration: 300 }),
        withSpring(0, { damping: 6 }),
      ),
    );
  }, [delay, rotate, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        },
        animStyle,
      ]}
    >
      <Image
        source={getAvatarSource(avatarKey)}
        style={{ width: size + 6, height: size + 6, resizeMode: 'contain' }}
      />
    </Animated.View>
  );
}

const ICON_BURSTS = [
  { name: 'star', top: '18%', left: '35%', size: 22, delay: 600, color: 'rgba(255,215,0,0.7)' },
  { name: 'star', top: '22%', right: '30%', size: 18, delay: 800, color: 'rgba(255,215,0,0.6)' },
  { name: 'sports-basketball', bottom: '32%', left: '25%', size: 20, delay: 900, color: 'rgba(255,255,255,0.4)' },
  { name: 'sports-football', bottom: '35%', right: '22%', size: 18, delay: 1000, color: 'rgba(255,255,255,0.4)' },
  { name: 'star', top: '35%', left: '12%', size: 16, delay: 1100, color: 'rgba(255,193,0,0.5)' },
  { name: 'star', top: '33%', right: '10%', size: 14, delay: 1200, color: 'rgba(255,193,0,0.5)' },
] as const;

function BurstIcon({ name, size, delay, color, ...pos }: typeof ICON_BURSTS[number]) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.4, { damping: 5, stiffness: 200 }),
        withSpring(1, { damping: 10 }),
      ),
    );
  }, [delay, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const posStyle: Record<string, any> = { position: 'absolute' };
  if ('top' in pos) posStyle.top = pos.top;
  if ('bottom' in pos) posStyle.bottom = pos.bottom;
  if ('left' in pos) posStyle.left = pos.left;
  if ('right' in pos) posStyle.right = pos.right;

  return (
    <Animated.View style={[posStyle, animStyle]}>
      <MaterialIcons name={name as any} size={size} color={color} />
    </Animated.View>
  );
}

interface WelcomeCelebrationProps {
  onFinish: () => void;
}

export default function WelcomeCelebration({ onFinish }: WelcomeCelebrationProps) {
  const randomAvatars = useMemo(() => shuffle(avatarKeys).slice(0, 8), []);

  const overlayOpacity = useSharedValue(1);
  const titleScale = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withDelay(
      200,
      withSpring(1, { damping: 8, stiffness: 100 }),
    );
    subtitleOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 500 }),
    );

    const timeout = setTimeout(() => {
      overlayOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, 3200);

    return () => clearTimeout(timeout);
  }, [onFinish, overlayOpacity, subtitleOpacity, titleScale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }, overlayStyle]}>
      <LinearGradient
        colors={['rgb(0,81,255)', 'rgb(85,0,198)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {AVATAR_POSITIONS.map((pos, i) => {
        const { size, delay, ...rest } = pos;
        const posStyle: Record<string, any> = {};
        if ('top' in rest) posStyle.top = rest.top;
        if ('bottom' in rest) posStyle.bottom = rest.bottom;
        if ('left' in rest) posStyle.left = rest.left;
        if ('right' in rest) posStyle.right = rest.right;

        return (
          <BouncingAvatar
            key={i}
            avatarKey={randomAvatars[i]}
            size={size}
            delay={delay}
            style={posStyle}
          />
        );
      })}

      {ICON_BURSTS.map((burst, i) => (
        <BurstIcon key={`burst-${i}`} {...burst} />
      ))}

      <View style={styles.centerContent}>
        <Animated.View style={titleStyle}>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.welcomeText}>
            WELCOME TO{'\n'}THE GAME!
          </Animated.Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Animated.Text style={styles.subtitleText}>
            Let's pick your avatar
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: Fonts.vanguardExtraBold,
    fontSize: 42,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 3,
    lineHeight: 50,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontFamily: Fonts.robotoCondensedRegular,
    fontSize: FontSizes.lg,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 1,
  },
});
