// ─── Founder Diaries Design System v4 ────────────────────────────────────────
// Light mode: warm cream + bright orange (#FF6B2B)
// Dark mode:  near-black (#111110) + orange (#FF7F3F)
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  surface: string;
  surface2: string;
  surfacePressed: string;
  card: string;
  tabBar: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  accentText: string;
  rust: string;
  warmBorder: string;
  warmSurface: string;
  warmMedium: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  platform: {
    linkedin: string;
    instagram: string;
    x: string;
  };
  white: string;
  black: string;
  // Legacy aliases for unmigrated usages
  primary: {
    50: string;
    100: string;
    200: string;
    500: string;
    600: string;
    700: string;
  };
  gray: {
    50: string;
    100: string;
    200: string;
    400: string;
    500: string;
    700: string;
    900: string;
  };
}

export const lightColors: ThemeColors = {
  background: '#FBF9F6',
  surface: '#F5F3F0',
  surface2: '#EFEEEB',
  surfacePressed: '#E8E3DC',
  card: '#FFFFFF',
  tabBar: '#FFFFFF',
  border: '#E5E0D8',
  borderStrong: '#CEC7BC',
  textPrimary: '#1B1C1A',
  textSecondary: '#635D58',
  textMuted: '#A09890',
  textInverse: '#FFFFFF',
  accent: '#FF6B2B',
  accentHover: '#E8520D',
  accentLight: '#FFF0E6',
  accentText: '#FFFFFF',
  rust: '#E8520D',
  warmBorder: '#FFD4B8',
  warmSurface: '#FFF0E6',
  warmMedium: '#B85A2B',
  success: '#1D9C5A',
  successLight: '#E6F7EE',
  warning: '#C97D0E',
  warningLight: '#FEF3CD',
  error: '#C53030',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
  platform: {
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    x: '#1A1A1A',
  },
  white: '#FFFFFF',
  black: '#1A1A1A',
  primary: {
    50: '#FFF0E6',
    100: '#FFD4B8',
    200: '#FFB085',
    500: '#FF6B2B',
    600: '#E8520D',
    700: '#B83D08',
  },
  gray: {
    50: '#FBF9F6',
    100: '#EFEEEB',
    200: '#E5E0D8',
    400: '#A09890',
    500: '#635D58',
    700: '#3D3835',
    900: '#1B1C1A',
  },
};

export const darkColors: ThemeColors = {
  background: '#111110',
  surface: '#1C1B1A',
  surface2: '#242320',
  surfacePressed: '#2E2C29',
  card: '#1C1B1A',
  tabBar: '#161514',
  border: '#2E2C29',
  borderStrong: '#3D3A36',
  textPrimary: '#F0EDE8',
  textSecondary: '#9C9690',
  textMuted: '#6B6560',
  textInverse: '#111110',
  accent: '#FF7F3F',
  accentHover: '#FF6B2B',
  accentLight: '#261E17',
  accentText: '#FFFFFF',
  rust: '#FF6B2B',
  warmBorder: '#3D2E22',
  warmSurface: '#261E17',
  warmMedium: '#E88A5A',
  success: '#22C55E',
  successLight: '#052E16',
  warning: '#F59E0B',
  warningLight: '#1C1000',
  error: '#FF5555',
  errorLight: '#2D0A0A',
  info: '#60A5FA',
  infoLight: '#0C1A3A',
  platform: {
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    x: '#E7E9EA',
  },
  white: '#FFFFFF',
  black: '#111110',
  primary: {
    50: '#261E17',
    100: '#3D2E22',
    200: '#7C3A00',
    500: '#FF7F3F',
    600: '#FF6B2B',
    700: '#FFB085',
  },
  gray: {
    50: '#111110',
    100: '#1C1B1A',
    200: '#2E2C29',
    400: '#6B6560',
    500: '#9C9690',
    700: '#C8C3BC',
    900: '#F0EDE8',
  },
};

// Legacy single-export (dark as default for unmigrated files)
export const colors: ThemeColors = darkColors;

// Legacy type aliases
export type Colors = ThemeColors;
export type DarkColors = ThemeColors;
