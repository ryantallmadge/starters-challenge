import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/theme';

export default function UpgradeScreen() {
  return (
    <LinearGradient colors={['rgb(0,81,255)', 'rgb(0,157,255)']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>
          There is an upgrade available, please visit the app store to download
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    color: Colors.white,
    fontSize: 16,
  },
});
