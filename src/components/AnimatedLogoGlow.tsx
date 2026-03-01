import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image } from 'react-native';

export default function AnimatedLogoGlow() {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (value: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      );

    Animated.parallel([
      createPulse(pulse1, 3000, 0),
      createPulse(pulse2, 2400, 400),
      createPulse(pulse3, 1800, 800),
    ]).start();
  }, [pulse1, pulse2, pulse3]);

  const outerScale = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.35],
  });
  const outerOpacity = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.35],
  });

  const midScale = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.4],
  });
  const midOpacity = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  const innerScale = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.5],
  });
  const innerOpacity = pulse3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });

  return (
    <View style={styles.logoContainer}>
      <Animated.View
        style={[
          styles.glowOuter,
          { transform: [{ scale: outerScale }], opacity: outerOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.glowMid,
          { transform: [{ scale: midScale }], opacity: midOpacity },
        ]}
      />
      <Animated.View
        style={[
          styles.glowInner,
          { transform: [{ scale: innerScale }], opacity: innerOpacity },
        ]}
      />
      <Image
        style={styles.logo}
        source={require('../../assets/images/starterslogo.png')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 400,
    height: 340,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 10,
  },
  glowMid: {
    position: 'absolute',
    width: 300,
    height: 260,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  glowInner: {
    position: 'absolute',
    width: 220,
    height: 200,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 45,
    elevation: 20,
  },
  logo: {
    width: 250,
    height: 200,
    resizeMode: 'contain',
  },
});
