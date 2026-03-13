import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

type Platform = 'linkedin' | 'instagram' | 'x';
type BadgeSize = 'sm' | 'md';

interface PlatformBadgeProps {
  platform: Platform;
  size?: BadgeSize;
  testID?: string;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; bg: string }> = {
  linkedin: { label: 'LinkedIn', bg: colors.platform.linkedin },
  instagram: { label: 'Instagram', bg: colors.platform.instagram },
  x: { label: 'X', bg: colors.platform.x },
};

export const PlatformBadge = memo(function PlatformBadge({
  platform,
  size = 'md',
  testID,
}: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }, size === 'sm' && styles.badgeSm]}
      testID={testID ?? `platform-badge-${platform}`}
      accessibilityLabel={`${config.label} platform`}
    >
      <Text style={[styles.label, size === 'sm' && styles.labelSm]}>{config.label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.white,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 14,
  },
});
