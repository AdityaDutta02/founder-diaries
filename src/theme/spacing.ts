import type { ThemeColors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

// Theme-aware shadow factory — call with current theme colors
export function makeShadows(colors: ThemeColors) {
  const c = colors.accent;
  const isDark = colors.background !== '#FBF9F6';
  return {
    none: {},
    sm: {
      shadowColor: isDark ? c : '#1A1A1A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.18 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: isDark ? c : '#1A1A1A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: isDark ? c : '#1A1A1A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    // Floating pill tab bar shadow
    tabBar: {
      shadowColor: isDark ? '#000000' : '#1A1A1A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.6 : 0.15,
      shadowRadius: 24,
      elevation: 16,
    },
  };
}

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;

// Static shadows for non-theme-aware contexts (neutral default)
export const shadows = {
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type ShadowKey = keyof typeof shadows;
