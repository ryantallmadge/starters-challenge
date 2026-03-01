import React from 'react';
import { StyleSheet, View, TextInput, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../theme';

interface AuthInputProps extends TextInputProps {
  icon: keyof typeof MaterialIcons.glyphMap;
}

export default function AuthInput({ icon, style, ...rest }: AuthInputProps) {
  return (
    <View style={styles.wrapper}>
      <MaterialIcons name={icon} size={20} color="rgba(255,255,255,0.6)" style={styles.icon} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="rgba(255,255,255,0.45)"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Colors.white,
    fontSize: FontSizes.base,
    fontFamily: Fonts.robotoCondensedRegular,
  },
});
