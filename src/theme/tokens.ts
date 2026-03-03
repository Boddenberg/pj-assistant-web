// ─── Design Tokens ───────────────────────────────────────────────────
// Single source of truth for colors, spacing, typography.
// Inspired by Itaú Unibanco brand — premium, clean, institutional.
//
// Principles:
//   • Orange is for action/highlight only — never structural
//   • Neutrals carry the structure (white, light gray, dark gray)
//   • Generous spacing ("respiro") between all sections
//   • Minimal shadows — cards rely on bg contrast, not elevation
//   • Two card styles: primary (orange bg) and secondary (white/light bg)

export const colors = {
  // Brand — Itaú official palette
  itauOrange: '#EC7000',
  itauOrangeLight: '#FF8C2E',
  itauOrangeDark: '#CC5F00',
  itauOrangeSoft: '#FFF4EB',
  itauBlue: '#003882',
  itauBlueDark: '#002D6B',
  itauBlueLight: '#1A5BA6',
  itauNavy: '#0D1B2A',

  // Backgrounds
  bgPrimary: '#F5F5F8',     // slightly cooler gray for premium feel
  bgSecondary: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgChat: '#F5F5F8',
  bgDark: '#1B1B1B',
  bgUserBubble: '#EC7000',
  bgAgentBubble: '#FFFFFF',
  bgHeader: '#EC7000',
  bgTabBar: '#FFFFFF',
  bgInput: '#F0F1F3',
  bgSheet: '#FFFFFF',       // for the sheet/card below header

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textInverse: '#FFFFFF',
  textMuted: '#8C8C8C',
  textOnOrange: '#FFFFFF',
  textLink: '#003882',
  textTertiary: '#A0A0A0',

  // Borders
  border: '#E5E5EA',
  borderLight: '#F0F0F2',
  borderFocus: '#EC7000',

  // Semantic
  success: '#00875A',
  successLight: '#E6F5EF',
  warning: '#E8A800',
  warningLight: '#FFF8E0',
  error: '#D42A2A',
  errorLight: '#FDEAEA',
  info: '#003882',
  infoLight: '#E6EDF5',
} as const

export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,       // more generous
  '2xl': 32,    // breathing room
  '3xl': 40,
  '4xl': 48,
  '5xl': 56,
  '6xl': 72,
} as const

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,    // for sheet top corners
  full: 9999,
} as const

export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '800' as const,
}

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const
