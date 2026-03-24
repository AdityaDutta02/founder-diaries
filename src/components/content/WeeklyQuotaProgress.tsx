import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeeklyQuotaEntry } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

const PLATFORM_LABELS: Record<WeeklyQuotaEntry['platform'], string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
};

interface QuotaCardProps {
  entry: WeeklyQuotaEntry;
}

function QuotaCard({ entry }: QuotaCardProps) {
  const { colors } = useTheme();
  const progress = entry.total > 0 ? entry.approved / entry.total : 0;
  const platformColor = colors.platform[entry.platform];
  const label = PLATFORM_LABELS[entry.platform];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID={`quota-card-${entry.platform}`}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
        <Text style={[styles.platformLabel, { color: colors.textPrimary }]}>
          {label}
        </Text>
        <View style={styles.statGroup}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>
            {entry.approved}
          </Text>
          <Text style={[styles.statDivider, { color: colors.textMuted }]}>
            {' / '}
          </Text>
          <Text style={[styles.statTotal, { color: colors.textMuted }]}>
            {entry.total}
          </Text>
        </View>
        <Text style={[styles.quotaLabel, { color: colors.textMuted }]}>
          posts
        </Text>
      </View>

      <View
        style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}
        testID={`quota-track-${entry.platform}`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        accessibilityLabel={`${label} quota: ${entry.approved} of ${entry.total} posts`}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: colors.accent,
            },
          ]}
          testID={`quota-fill-${entry.platform}`}
        />
      </View>
    </View>
  );
}

interface WeeklyQuotaProgressProps {
  quotas: WeeklyQuotaEntry[];
  testID?: string;
}

export const WeeklyQuotaProgress = memo(function WeeklyQuotaProgress({
  quotas,
  testID,
}: WeeklyQuotaProgressProps) {
  return (
    <View style={styles.container} testID={testID ?? 'weekly-quota-progress'}>
      {quotas.map((entry) => (
        <QuotaCard key={entry.platform} entry={entry} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  platformLabel: {
    ...typography.label,
    flex: 1,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    ...typography.numericSm,
  },
  statDivider: {
    ...typography.bodySm,
  },
  statTotal: {
    ...typography.bodySm,
  },
  quotaLabel: {
    ...typography.caption,
  },
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
