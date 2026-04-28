export const colors = {
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1a1a1a',
  surfaceHigh: '#222222',
  border: 'rgba(255,255,255,0.06)',
  borderMedium: 'rgba(255,255,255,0.1)',

  primary: '#635BFF',
  primaryLight: '#8B85FF',
  primarySoft: 'rgba(99, 91, 255, 0.12)',
  primaryGlow: 'rgba(99, 91, 255, 0.35)',
  primaryBorder: 'rgba(99, 91, 255, 0.25)',

  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textDim: 'rgba(255,255,255,0.3)',

  red: '#E84855',
  green: '#30D158',
  blue: '#0A84FF',

  fire: '#FF8C42',
  fireSoft: 'rgba(255, 120, 30, 0.2)',
  fireBorder: 'rgba(255, 120, 30, 0.3)',

  // aliases for backwards compatibility
  primaryDim: 'rgba(99, 91, 255, 0.12)',
  orange: '#FF8C42',

  tabBar: '#0a0a0a',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  cardBackground: '#141414',
  inputBackground: '#1a1a1a',
  overlay: 'rgba(0,0,0,0.75)',
};

export const fonts = {
  display: 'BebasNeue_400Regular',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemiBold: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
};

export const typography = {
  display: { fontFamily: 'BebasNeue_400Regular', color: colors.text, letterSpacing: 2 },
  h1: { fontFamily: 'Barlow_700Bold', fontSize: 28, color: colors.text },
  h2: { fontFamily: 'Barlow_700Bold', fontSize: 22, color: colors.text },
  h3: { fontFamily: 'Barlow_600SemiBold', fontSize: 18, color: colors.text },
  body: { fontFamily: 'Barlow_400Regular', fontSize: 15, color: colors.text },
  bodyMedium: { fontFamily: 'Barlow_500Medium', fontSize: 15, color: colors.text },
  bodySemiBold: { fontFamily: 'Barlow_600SemiBold', fontSize: 15, color: colors.text },
  bodySecondary: { fontFamily: 'Barlow_400Regular', fontSize: 15, color: colors.textSecondary },
  caption: { fontFamily: 'Barlow_400Regular', fontSize: 12, color: colors.textSecondary },
  label: { fontFamily: 'Barlow_600SemiBold', fontSize: 10, color: colors.textDim, textTransform: 'uppercase' as const, letterSpacing: 1.5 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 50,
  full: 9999,
};
