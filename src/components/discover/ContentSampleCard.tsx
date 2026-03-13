import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';

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
  const engagementPct =
    sample.engagement_score !== null
      ? `${(sample.engagement_score * 100).toFixed(1)}% engagement`
      : null;

  return (
    <View
      style={styles.card}
      testID={testID ?? 'content-sample-card'}
    >
      <Text style={styles.contentText} numberOfLines={4} testID="sample-content-text">
        {sample.content_text}
      </Text>

      <View style={styles.statsRow} testID="sample-stats-row">
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statValue}>{formatCount(sample.likes_count)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statValue}>{formatCount(sample.comments_count)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>↗️</Text>
          <Text style={styles.statValue}>{formatCount(sample.shares_count)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {engagementPct !== null && (
          <View style={styles.engagementBadge} testID="sample-engagement">
            <Text style={styles.engagementText}>{engagementPct}</Text>
          </View>
        )}
        {sample.posted_at ? (
          <Text style={styles.dateText} testID="sample-date">
            {formatDate(sample.posted_at)}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  contentText: {
    ...typography.bodyMd,
    color: colors.gray[700],
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: {
    fontSize: 14,
  },
  statValue: {
    ...typography.bodySm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  engagementText: {
    ...typography.bodySm,
    color: colors.primary[600],
    fontWeight: '600',
  },
  dateText: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
});
