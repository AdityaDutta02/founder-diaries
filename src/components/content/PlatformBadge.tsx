import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

type Platform = 'linkedin' | 'instagram' | 'x';
type BadgeSize = 'sm' | 'md';

interface PlatformBadgeProps {
  platform: Platform;
  size?: BadgeSize;
  testID?: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
};

export const PlatformBadge = memo(function PlatformBadge({
  platform,
  size = 'md',
  testID,
}: PlatformBadgeProps) {
  const { colors } = useTheme();
  const platformColor = colors.platform[platform];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: platformColor },
        size === 'sm' && styles.badgeSm,
      ]}
      testID={testID ?? `platform-badge-${platform}`}
      accessibilityLabel={`${PLATFORM_LABELS[platform]} platform`}
    >
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color: colors.accentText }]}>
        {PLATFORM_LABELS[platform]}
      </Text>
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
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 14,
  },
});
