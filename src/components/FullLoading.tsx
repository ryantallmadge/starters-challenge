import React from 'react';
import { StyleSheet, View, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { Colors } from '../theme';

export default function FullLoading() {
  return (
    <ImageBackground
      source={require('../../assets/images/play-tab/funBlueBackground.png')}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/starterslogo.png')}
        />
        <View style={{ height: 30 }} />
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    </ImageBackground>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 200,
    resizeMode: 'contain',
  },
});
