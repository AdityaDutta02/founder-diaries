import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fontFamily, typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { Badge } from '@/components/ui/Badge';
import type { ContentWritingProfile } from '@/types/database';
import { PlatformBadge } from './PlatformBadge';

interface WritingProfileCardProps {
  profile: ContentWritingProfile;
  onRefresh: (platform: ContentWritingProfile['platform']) => void;
  testID?: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const WritingProfileCard = memo(function WritingProfileCard({
  profile,
  onRefresh,
  testID,
}: WritingProfileCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID={testID ?? `writing-profile-card-${profile.platform}`}
    >
      {/* Platform header */}
      <View style={styles.header}>
        <PlatformBadge platform={profile.platform} size="md" />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Writing Profile
        </Text>
        <Text style={[styles.refreshedDate, { color: colors.textMuted }]}>
          {formatDate(profile.last_refreshed)}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Body */}
      <View style={styles.body}>
        {/* Tone */}
        {profile.tone_description ? (
          <View style={styles.row} testID="profile-tone">
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Tone</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {profile.tone_description}
            </Text>
          </View>
        ) : null}

        {/* Hook style */}
        {profile.format_patterns?.hookStyle ? (
          <View style={styles.row} testID="profile-hook-style">
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Hook style</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {profile.format_patterns.hookStyle}
            </Text>
          </View>
        ) : null}

        {/* Typical length */}
        {profile.format_patterns?.averageLength ? (
          <View style={styles.row} testID="profile-length">
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Typical length</Text>
            <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
              {profile.format_patterns.averageLength} chars
            </Text>
          </View>
        ) : null}

        {/* Example hooks */}
        {profile.example_hooks && profile.example_hooks.length > 0 ? (
          <View style={styles.exampleHooksSection} testID="profile-example-hooks">
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Example hooks</Text>
            {profile.example_hooks.slice(0, 3).map((hook, i) => (
              <View
                key={i}
                style={[styles.hookItem, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                testID={`hook-${i}`}
              >
                <Text style={[styles.hookIndex, { color: colors.accent }]}>{i + 1}</Text>
                <Text style={[styles.hookText, { color: colors.textSecondary }]}>{hook}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Hashtag strategy */}
        {profile.hashtag_strategy?.exampleHashtags &&
          profile.hashtag_strategy.exampleHashtags.length > 0 ? (
          <View style={styles.hashtagSection} testID="profile-hashtags">
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Hashtag strategy</Text>
            <Text style={[styles.hashtagMeta, { color: colors.textSecondary }]}>
              {`Avg ${profile.hashtag_strategy.averageCount} tags · ${profile.hashtag_strategy.broadToNicheRatio} ratio`}
            </Text>
            <View style={styles.hashtagRow}>
              {profile.hashtag_strategy.exampleHashtags.slice(0, 5).map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Refresh button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => onRefresh(profile.platform)}
          style={({ pressed }) => [
            styles.refreshBtn,
            {
              backgroundColor: pressed ? colors.surfacePressed : 'transparent',
              borderColor: colors.borderStrong,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Refresh ${profile.platform} writing profile analysis`}
          testID="refresh-profile-button"
        >
          <Text style={[styles.refreshIcon, { color: colors.textSecondary }]}>↻</Text>
          <Text style={[styles.refreshLabel, { color: colors.textSecondary }]}>
            Refresh Analysis
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  refreshedDate: {
    ...typography.caption,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    gap: 3,
  },
  rowLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  exampleHooksSection: {
    gap: spacing.sm,
  },
  hookItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'flex-start',
  },
  hookIndex: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 18,
    minWidth: 14,
  },
  hookText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  hashtagSection: {
    gap: spacing.xs,
  },
  hashtagMeta: {
    ...typography.bodySm,
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  refreshIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
  refreshLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
