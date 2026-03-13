import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
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
  const clampedDays = Math.min(Math.max(daysCompleted, 0), totalDays);
  const progressRatio = totalDays > 0 ? clampedDays / totalDays : 0;

  return (
    <View style={styles.card} testID={testID ?? 'discovery-countdown'}>
      <Text style={styles.icon} accessibilityLabel="Unlock content engine">
        {clampedDays === 0 ? '🔒' : '🚀'}
      </Text>
      <View style={styles.textContainer}>
        <Text style={styles.heading}>Unlock Your Content Engine</Text>
        <Text style={styles.body}>
          Record your journey for 7 days to activate AI content generation
        </Text>
      </View>
      <View style={styles.progressContainer} testID="progress-bar-container">
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progressRatio * 100}%` }]}
            testID="progress-fill"
          />
        </View>
        <Text style={styles.progressLabel} testID="progress-label">
          {`${clampedDays}/${totalDays} days completed`}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    fontSize: 28,
    alignSelf: 'flex-start',
  },
  textContainer: {
    gap: spacing.xs,
  },
  heading: {
    ...typography.headingMd,
    color: colors.primary[700],
  },
  body: {
    ...typography.bodySm,
    color: colors.primary[600],
    lineHeight: 18,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.primary[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressLabel: {
    ...typography.label,
    color: colors.primary[600],
  },
});
