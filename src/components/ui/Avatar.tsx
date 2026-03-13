import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius } from '@/theme/spacing';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: string;
  fallback: string;
  size?: AvatarSize;
  testID?: string;
}

const SIZE_VALUES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 22,
};

function getInitials(fallback: string): string {
  const trimmed = fallback.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

export const Avatar = memo(function Avatar({
  source,
  fallback,
  size = 'md',
  testID,
}: AvatarProps) {
  const dimension = SIZE_VALUES[size];
  const fontSize = FONT_SIZES[size];
  const initials = getInitials(fallback);

  const containerStyle = [
    styles.base,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
  ];

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[containerStyle, styles.image]}
        testID={testID ?? 'avatar-image'}
        accessibilityLabel={`${fallback} avatar`}
        accessibilityRole="image"
      />
    );
  }

  return (
    <View
      style={[containerStyle, styles.fallbackContainer]}
      testID={testID ?? 'avatar-fallback'}
      accessibilityLabel={`${fallback} avatar`}
      accessibilityRole="image"
    >
      <Text
        style={[
          typography.label,
          styles.initials,
          { fontSize, lineHeight: fontSize + 2 },
        ]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  fallbackContainer: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
  },
  initials: {
    color: colors.primary[700],
    fontWeight: '600',
  },
});
