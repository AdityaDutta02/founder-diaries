import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Platform } from '@/types/database';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
  testID?: string;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'in',
  instagram: 'IG',
  x: 'X',
};

export const PlatformBadge = memo(function PlatformBadge({
  platform,
  size = 'sm',
  testID,
}: PlatformBadgeProps) {
  return (
    <View
      style={[styles.badge, styles[`badge_${size}`], { backgroundColor: colors.platform[platform] }]}
      testID={testID ?? `platform-badge-${platform}`}
    >
      <Text style={[styles.label, styles[`label_${size}`]]}>{PLATFORM_LABELS[platform]}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  badge_sm: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  badge_md: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  label: {
    color: colors.white,
    fontWeight: '700',
  },
  label_sm: {
    ...typography.bodySm,
    fontSize: 10,
    lineHeight: 13,
  },
  label_md: {
    ...typography.bodySm,
    fontWeight: '700',
  },
});
