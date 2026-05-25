export const colors = {
  // ── Deep space backgrounds ──
  background: '#080B18',
  backgroundSecondary: '#0D1226',
  backgroundTertiary: '#111827',

  // ── Glassmorphism ──
  glass: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.13)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
  glassStrongBorder: 'rgba(255, 255, 255, 0.20)',
  glassDark: 'rgba(0, 0, 0, 0.3)',

  // ── Primary purple ──
  primary: '#7C3AED',
  primaryLight: '#9F7AEA',
  primaryDark: '#5B21B6',
  primaryGlow: 'rgba(124, 58, 237, 0.35)',

  // ── Cyan accent ──
  secondary: '#06B6D4',
  secondaryLight: '#67E8F9',
  secondaryDark: '#0891B2',
  secondaryGlow: 'rgba(6, 182, 212, 0.35)',

  // ── Pink accent ──
  accent: '#EC4899',
  accentLight: '#F9A8D4',
  accentDark: '#BE185D',
  accentGlow: 'rgba(236, 72, 153, 0.35)',

  // ── Status colors ──
  success: '#10B981',
  successLight: '#6EE7B7',
  successGlow: 'rgba(16, 185, 129, 0.35)',

  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningGlow: 'rgba(245, 158, 11, 0.35)',

  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  dangerGlow: 'rgba(239, 68, 68, 0.35)',

  // ── Text ──
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(255, 255, 255, 0.35)',
  textDisabled: 'rgba(255, 255, 255, 0.2)',

  // ── Stress level indicators ──
  stressLow: '#10B981',
  stressModerate: '#F59E0B',
  stressHigh: '#EF4444',

  // ── Gradients (LinearGradient arrays) ──
  gradientBackground: ['#080B18', '#0D1226', '#1a0e3a'],
  gradientPrimary:   ['#7C3AED', '#4F46E5'],
  gradientSecondary: ['#06B6D4', '#0891B2'],
  gradientPink:      ['#EC4899', '#BE185D'],
  gradientSuccess:   ['#10B981', '#059669'],
  gradientWarning:   ['#F59E0B', '#D97706'],
  gradientDanger:    ['#EF4444', '#DC2626'],
  gradientCool:      ['#7C3AED', '#06B6D4'],
  gradientSunset:    ['#EC4899', '#7C3AED'],
  gradientAurora:    ['#06B6D4', '#7C3AED', '#EC4899'],
  gradientGold:      ['#F59E0B', '#EF4444'],
  gradientMint:      ['#10B981', '#06B6D4'],
  gradientNight:     ['#1a0e3a', '#0D1226'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const typography = {
  hero:     { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  h1:       { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2:       { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:       { fontSize: 18, fontWeight: '600' },
  body:     { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption:  { fontSize: 12, fontWeight: '400', letterSpacing: 0.3 },
  label:    { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
};
