import { Platform, StyleSheet } from 'react-native';

// Space Grotesk weights available via @expo-google-fonts/space-grotesk
export const fontFamily = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
  // DM Serif Display for the FOUNDER DIARIES brand wordmark
  // Install: npx expo install @expo-google-fonts/dm-serif-display
  // Then register DMSerifDisplay_400Regular in _layout.tsx
  serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  // Fallbacks for system font before fonts load
  regularFallback: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  boldFallback: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
};

export const typography = StyleSheet.create({
  // Display — hero numbers / stats (Aeonik-style large display)
  displayXl: {
    fontFamily: fontFamily.bold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
  },
  displayLg: {
    fontFamily: fontFamily.bold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  displayMd: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
  },

  // Headings
  headingXl: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  headingLg: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headingMd: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  headingSm: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  // Body
  bodyLg: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
  },
  bodyMd: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },

  // UI
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.1,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },

  // Numeric display (for stats, dates, counts)
  numericLg: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
  },
  numericMd: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  numericSm: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 22,
  },
});

export type TypographyKey = keyof typeof typography;
