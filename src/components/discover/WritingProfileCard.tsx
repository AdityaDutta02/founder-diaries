import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ContentWritingProfile } from '@/types/database';
import { PlatformBadge } from './PlatformBadge';

interface WritingProfileCardProps {
  profile: ContentWritingProfile;
  onRefresh: (platform: ContentWritingProfile['platform']) => void;
  testID?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const WritingProfileCard = memo(function WritingProfileCard({
  profile,
  onRefresh,
  testID,
}: WritingProfileCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card} testID={testID ?? `writing-profile-card-${profile.platform}`}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${profile.platform} writing profile`}
        testID="writing-profile-toggle"
      >
        <View style={styles.headerLeft}>
          <PlatformBadge platform={profile.platform} size="md" />
          <Text style={styles.headerTitle}>Writing Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.refreshedDate}>{formatDate(profile.last_refreshed)}</Text>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>

      {/* Collapsed preview */}
      {!expanded && (
        <View style={styles.collapsedContent} testID="writing-profile-collapsed">
          <Text style={styles.tonePreview} numberOfLines={1}>
            {profile.tone_description ?? 'No tone description yet'}
          </Text>
          <Text style={styles.expandHint}>Tap to expand</Text>
        </View>
      )}

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedContent} testID="writing-profile-expanded">
          {/* Tone */}
          {profile.tone_description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tone</Text>
              <Text style={styles.sectionBody}>{profile.tone_description}</Text>
            </View>
          ) : null}

          {/* Format */}
          {profile.format_patterns ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Format</Text>
              <Text style={styles.sectionBody}>
                Hook style: {profile.format_patterns.hookStyle}
              </Text>
              <Text style={styles.sectionBody}>
                Avg length: {profile.format_patterns.averageLength} words
              </Text>
              <Text style={styles.sectionBody}>
                Structure:{' '}
                {profile.structural_patterns?.primaryStructure ?? 'Standard'}
              </Text>
            </View>
          ) : null}

          {/* Example Hooks */}
          {profile.example_hooks && profile.example_hooks.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Example Hooks</Text>
              {profile.example_hooks.map((hook, index) => (
                <Text key={index} style={styles.hookItem} testID={`hook-${index}`}>
                  {index + 1}. <Text style={styles.hookText}>{hook}</Text>
                </Text>
              ))}
            </View>
          ) : null}

          {/* Hashtags */}
          {profile.hashtag_strategy ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hashtag Strategy</Text>
              <Text style={styles.sectionBody}>
                Avg {profile.hashtag_strategy.averageCount} tags •{' '}
                {profile.hashtag_strategy.broadToNicheRatio} ratio
              </Text>
              <View style={styles.hashtagRow}>
                {profile.hashtag_strategy.exampleHashtags.slice(0, 5).map((tag) => (
                  <Badge key={tag} label={tag} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Footer */}
          <Button
            label="Refresh Profile"
            variant="outline"
            size="sm"
            onPress={() => onRefresh(profile.platform)}
            testID="refresh-profile-button"
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  refreshedDate: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  chevron: {
    fontSize: 12,
    color: colors.gray[400],
  },
  collapsedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: 2,
  },
  tonePreview: {
    ...typography.bodyMd,
    color: colors.gray[700],
  },
  expandHint: {
    ...typography.bodySm,
    color: colors.primary[500],
  },
  expandedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.headingSm,
    color: colors.gray[900],
    fontSize: 14,
  },
  sectionBody: {
    ...typography.bodyMd,
    color: colors.gray[700],
  },
  hookItem: {
    ...typography.bodyMd,
    color: colors.gray[700],
    lineHeight: 22,
  },
  hookText: {
    fontStyle: 'italic',
    color: colors.gray[500],
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
