import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeeklyQuotaEntry } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';

const PLATFORM_COLORS: Record<WeeklyQuotaEntry['platform'], string> = {
  linkedin: colors.platform.linkedin,
  instagram: colors.platform.instagram,
  x: colors.platform.x,
};

const PLATFORM_LABELS: Record<WeeklyQuotaEntry['platform'], string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
};

const PLATFORM_EMOJIS: Record<WeeklyQuotaEntry['platform'], string> = {
  linkedin: '🔵',
  instagram: '🟣',
  x: '⚫',
};

interface QuotaCardProps {
  entry: WeeklyQuotaEntry;
}

function QuotaCard({ entry }: QuotaCardProps) {
  const progress = entry.total > 0 ? entry.approved / entry.total : 0;
  const platformColor = PLATFORM_COLORS[entry.platform];
  const label = PLATFORM_LABELS[entry.platform];
  const emoji = PLATFORM_EMOJIS[entry.platform];

  return (
    <View style={styles.card} testID={`quota-card-${entry.platform}`}>
      <View style={styles.cardHeader}>
        <Text style={styles.platformEmoji}>{emoji}</Text>
        <Text style={styles.platformLabel}>{label}</Text>
        <Text style={styles.quotaText}>
          {entry.approved} of {entry.total} posts this week
        </Text>
      </View>
      <View style={styles.progressTrack} testID={`quota-track-${entry.platform}`}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: platformColor },
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  platformEmoji: {
    fontSize: 14,
  },
  platformLabel: {
    ...typography.bodySm,
    color: colors.gray[700],
    fontWeight: '600',
    flex: 1,
  },
  quotaText: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});
