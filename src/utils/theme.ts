export const colors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  border: '#2C2C2C',
  primary: '#FF5733',
  primaryDim: '#FF573320',
  accent: '#FF8C42',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textDim: '#606060',
  red: '#FF3B30',
  green: '#30D158',
  blue: '#0A84FF',
  orange: '#FF9F0A',
  tabBar: '#111111',
  tabBarBorder: '#2C2C2C',
  cardBackground: '#1A1A1A',
  inputBackground: '#242424',
  overlay: 'rgba(0,0,0,0.7)',
  fire: '#FF6B00',
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodySecondary: { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textSecondary },
  label: { fontSize: 13, fontWeight: '500' as const, color: colors.textSecondary },
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
