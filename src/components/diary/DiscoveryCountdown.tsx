import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface DiscoveryCountdownProps {
  daysCompleted: number;
  totalDays: number;
  testID?: string;
}

export const DiscoveryCountdown = memo(function DiscoveryCountdown({
  daysCompleted,
  totalDays,
  testID,
}: DiscoveryCountdownProps) {
  const { colors } = useTheme();

  const clampedDays = Math.min(Math.max(daysCompleted, 0), totalDays);
  const progressRatio = totalDays > 0 ? clampedDays / totalDays : 0;
  const daysLeft = Math.max(totalDays - clampedDays, 0);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
      }}
      testID={testID ?? 'discovery-countdown'}
    >
      {/* Icon + title row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: 20 }} accessibilityLabel="Locked">
          {'🔒'}
        </Text>
        <Text
          style={{ ...typography.headingSm, color: colors.textPrimary, flex: 1 }}
          testID="discovery-title"
        >
          Unlock AI-powered content
        </Text>
      </View>

      {/* Body */}
      <Text
        style={{ ...typography.bodyMd, color: colors.textSecondary }}
        testID="discovery-body"
      >
        {`Record for ${daysLeft} more ${daysLeft === 1 ? 'day' : 'days'} to discover creators in your niche.`}
      </Text>

      {/* Progress bar */}
      <View style={{ gap: spacing.xs }} testID="progress-bar-container">
        <View
          style={{
            height: 8,
            backgroundColor: colors.surface2,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progressRatio * 100}%`,
              backgroundColor: colors.accent,
              borderRadius: borderRadius.full,
            }}
            testID="progress-fill"
          />
        </View>
        <Text
          style={{ ...typography.label, color: colors.textMuted }}
          testID="progress-label"
        >
          {`${clampedDays} of ${totalDays} days`}
        </Text>
      </View>
    </View>
  );
});
