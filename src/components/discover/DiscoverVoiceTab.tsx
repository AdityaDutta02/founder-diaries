import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import type { Platform } from '@/types/database';

export interface WritingProfile {
  id: string;
  platform: Platform;
  tone?: string | null;
  hook_style?: string | null;
  typical_length?: string | null;
  example_hooks?: string[] | null;
}

interface DiscoverVoiceTabProps {
  profiles: WritingProfile[];
}

export const DiscoverVoiceTab = memo(function DiscoverVoiceTab({
  profiles,
}: DiscoverVoiceTabProps) {
  const { colors } = useTheme();

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyState} testID="voice-tab-empty">
        <Text style={styles.emptyEmoji}>{'✍️'}</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Your writing profile is being built as you write more diary entries.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      testID="your-voice-tab"
    >
      {profiles.map((wp) => (
        <View
          key={wp.id}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          testID={`voice-card-${wp.platform}`}
        >
          <Text style={[styles.platform, { color: colors.accent }]}>
            {wp.platform.charAt(0).toUpperCase() + wp.platform.slice(1)}
          </Text>

          {wp.tone ? (
            <Text style={[styles.row, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.medium }}>
                Tone:{' '}
              </Text>
              {wp.tone}
            </Text>
          ) : null}

          {wp.hook_style ? (
            <Text style={[styles.row, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.medium }}>
                Hook style:{' '}
              </Text>
              {wp.hook_style}
            </Text>
          ) : null}

          {wp.typical_length ? (
            <Text style={[styles.row, { color: colors.textSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.medium }}>
                Typical length:{' '}
              </Text>
              {wp.typical_length}
            </Text>
          ) : null}

          {wp.example_hooks && wp.example_hooks.length > 0 ? (
            <View style={styles.hooksSection}>
              <Text style={[styles.hooksLabel, { color: colors.textMuted }]}>
                Example hooks
              </Text>
              {wp.example_hooks.slice(0, 3).map((hook, i) => (
                <View
                  key={i}
                  style={[styles.hookRow, { borderLeftColor: colors.accent }]}
                >
                  <Text style={[styles.hookText, { color: colors.textSecondary }]}>
                    {hook}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyText: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  platform: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 20,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  row: {
    ...typography.bodyMd,
    lineHeight: 22,
  },
  hooksSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  hooksLabel: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hookRow: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
  },
  hookText: {
    ...typography.bodyMd,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
