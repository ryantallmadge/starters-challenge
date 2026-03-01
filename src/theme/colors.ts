export const Colors = {
  primaryBlue: 'rgb(0,81,255)',
  primaryBlueLight: 'rgb(0,157,255)',
  primaryBlueLink: 'rgb(0,126,255)',

  successGreen: 'rgb(5,208,123)',
  successGreenDark: 'rgb(11,152,93)',
  successGreenLight: 'rgb(75,242,172)',
  successGreenCyan: 'rgb(66,247,170)',

  backgroundDark: 'rgb(7,25,42)',
  backgroundLight: 'rgb(239,247,255)',

  accentOrange: 'rgb(255,92,42)',
  accentYellow: 'rgb(255,193,0)',
  accentPurple: 'rgb(85,0,198)',

  neutralLight: 'rgb(220,224,230)',
  neutralMid: 'rgb(150,163,184)',
  neutralTabUnselected: 'rgb(159,174,193)',
  neutralShadow: 'rgb(136,158,186)',

  progressBarBg: 'rgb(4,62,180)',
  progressBarFill: 'rgb(0,253,255)',

  cancelGrey: 'rgb(71,89,106)',
  avatarBlueBg: '#599AFF',
  leaderboardLabel: 'rgb(59,119,179)',
  recordsLabel: 'rgb(181,227,255)',
  leaderboardAchievement: 'rgb(109,160,247)',

  white: '#FFFFFF',
  black: '#000000',
  error: '#800000',
  grey: 'grey',
  transparent: 'transparent',
} as const;

export const Gradients = {
  blueDefault: ['rgb(0,81,255)', 'rgb(0,157,255)'] as const,
  greenLogin: ['rgb(11,152,93)', 'rgb(75,242,172)'] as const,
  darkHeader: ['rgb(6,14,43)', 'rgb(7,25,42)'] as const,
} as const;
