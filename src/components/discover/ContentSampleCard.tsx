import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export interface ContentSampleData {
  content_text: string;
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  engagement_score: number | null;
  posted_at: string | null;
}

interface ContentSampleCardProps {
  sample: ContentSampleData;
  testID?: string;
}

function formatCount(count: number | null): string {
  if (count === null) return '0';
  if (count >= 1_000) return `${Math.round(count / 1_000)}K`;
  return String(count);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ContentSampleCard = memo(function ContentSampleCard({
  sample,
  testID,
}: ContentSampleCardProps) {
  const { colors } = useTheme();

  const engagementPct =
    sample.engagement_score !== null
      ? `${(sample.engagement_score * 100).toFixed(1)}% engagement`
      : null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID={testID ?? 'content-sample-card'}
    >
      <Text
        style={[styles.contentText, { color: colors.textPrimary }]}
        numberOfLines={4}
        testID="sample-content-text"
      >
        {sample.content_text}
      </Text>

      <View style={styles.statsRow} testID="sample-stats-row">
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Likes</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatCount(sample.likes_count)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Comments</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatCount(sample.comments_count)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Shares</Text>
          <Text style={[styles.statValue, { color: colors.textSecondary }]}>
            {formatCount(sample.shares_count)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        {engagementPct !== null && (
          <View
            style={[styles.engagementBadge, { backgroundColor: colors.accentLight }]}
            testID="sample-engagement"
          >
            <Text style={[styles.engagementText, { color: colors.accent }]}>
              {engagementPct}
            </Text>
          </View>
        )}
        {sample.posted_at ? (
          <Text
            style={[styles.dateText, { color: colors.textMuted }]}
            testID="sample-date"
          >
            {formatDate(sample.posted_at)}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  contentText: {
    ...typography.bodyMd,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
  },
  statValue: {
    ...typography.bodySm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementBadge: {
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  engagementText: {
    ...typography.label,
  },
  dateText: {
    ...typography.caption,
  },
});
