import { Platform, StyleSheet } from 'react-native';

// Platform-aware font weight: iOS accepts numeric strings, Android may need named values.
// React Native accepts '700' | 'bold' etc. We use string literals from the type union.
const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: Platform.OS === 'ios' ? ('600' as const) : ('600' as const),
  bold: '700' as const,
};

export const typography = StyleSheet.create({
  headingXl: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    lineHeight: 34,
  },
  headingLg: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  headingMd: {
    fontSize: 18,
    fontWeight: fontWeight.semibold,
    lineHeight: 24,
  },
  headingSm: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: fontWeight.regular,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
});

export type TypographyKey = keyof typeof typography;
