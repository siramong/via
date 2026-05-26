export const colors = {
  primary: '#4CC9F0',
  primaryLight: 'rgba(76, 201, 240, 0.15)',
  success: '#35D07F',
  successLight: 'rgba(53, 208, 127, 0.15)',
  warning: '#FFB547',
  warningLight: 'rgba(255, 181, 71, 0.15)',
  danger: '#FF5C5C',
  dangerLight: 'rgba(255, 92, 92, 0.15)',
  background: '#0B1020',
  card: '#121A2E',
  glass: 'rgba(18, 26, 46, 0.78)',
  surface1: 'rgba(18, 26, 46, 0.9)',
  surface2: 'rgba(14, 20, 36, 0.85)',
  surface3: 'rgba(10, 15, 28, 0.95)',
  overlay: 'rgba(8, 12, 24, 0.75)',
  accent: '#8CF4FF',
  textPrimary: '#F5F8FF',
  textSecondary: '#A6B0D6',
  textMuted: 'rgba(166, 176, 214, 0.5)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  xl: 32,
  full: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: 0.5, lineHeight: 38 },
  h2: { fontSize: 26, fontWeight: '800' as const, letterSpacing: 0.3, lineHeight: 32 },
  h3: { fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.2, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '700' as const, letterSpacing: 0.1, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '700' as const, lineHeight: 16, letterSpacing: 0.5 },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1.2, lineHeight: 14, textTransform: 'uppercase' as const },
  price: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 36 },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  glow: {
    shadowColor: '#4CC9F0',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
};
