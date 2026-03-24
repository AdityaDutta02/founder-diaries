import React, { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
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
  const { colors } = useTheme();
  const dimension = SIZE_VALUES[size];
  const fontSize = FONT_SIZES[size];
  const initials = getInitials(fallback);

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[containerStyle, { resizeMode: 'cover' }]}
        testID={testID ?? 'avatar-image'}
        accessibilityLabel={`${fallback} avatar`}
        accessibilityRole="image"
      />
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: colors.surface2,
          borderRadius: borderRadius.full,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
      testID={testID ?? 'avatar-fallback'}
      accessibilityLabel={`${fallback} avatar`}
      accessibilityRole="image"
    >
      <Text
        style={[
          typography.label,
          { fontSize, lineHeight: fontSize + 2, color: colors.textSecondary, fontWeight: '600' },
        ]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
});
