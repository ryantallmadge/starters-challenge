import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes } from '../theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  colors: readonly [string, string];
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({
  label,
  onPress,
  colors,
  disabled = false,
  loading = false,
  style,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.touchable, style]}
    >
      <LinearGradient
        colors={disabled ? ['rgba(150,163,184,0.6)', 'rgba(150,163,184,0.4)'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.vanguardBold,
    textTransform: 'uppercase',
    color: Colors.white,
    letterSpacing: 1.5,
  },
});
