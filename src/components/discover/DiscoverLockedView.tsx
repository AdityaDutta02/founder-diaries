import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

const DISCOVERY_TOTAL_DAYS = 7;

interface DiscoverLockedViewProps {
  completedDays: number;
  onGoToDiary: () => void;
}

export const DiscoverLockedView = memo(function DiscoverLockedView({
  completedDays,
  onGoToDiary,
}: DiscoverLockedViewProps) {
  const { colors } = useTheme();
  const clamped = Math.min(completedDays, DISCOVERY_TOTAL_DAYS);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="discover-locked-view"
    >
      {/* Lock icon */}
      <Text style={styles.lockEmoji} accessibilityLabel="Locked">{'🔒'}</Text>

      {/* Headline */}
      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        Unlock your content engine
      </Text>

      {/* Body */}
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Write diary entries for 7 days and we'll analyze top creators in your niche to craft your unique voice.
      </Text>

      {/* Progress section */}
      <View style={styles.progressSection} testID="unlock-progress">
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          <Text style={{ color: colors.accent, fontFamily: fontFamily.bold }}>
            {clamped}
          </Text>
          {` of ${DISCOVERY_TOTAL_DAYS} days completed`}
        </Text>

        {/* 7 day dots */}
        <View style={styles.dayDots}>
          {Array.from({ length: DISCOVERY_TOTAL_DAYS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.dayDot,
                {
                  backgroundColor: i < clamped ? colors.accent : colors.surface2,
                  borderColor: i < clamped ? colors.accent : colors.border,
                },
              ]}
              testID={`day-dot-${i}`}
            />
          ))}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(clamped / DISCOVERY_TOTAL_DAYS) * 100}%`,
                backgroundColor: colors.accent,
              },
            ]}
            testID="progress-fill"
          />
        </View>
      </View>

      {/* Why 7 days note */}
      <View style={[styles.whyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.whyText, { color: colors.textMuted }]}>
          Why 7 days? We need enough of your voice to match you with the right creators.
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        onPress={onGoToDiary}
        style={({ pressed }) => [
          styles.diaryBtn,
          { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        testID="go-to-diary-btn"
      >
        <Text style={[styles.diaryBtnText, { color: colors.accentText }]}>
          Go to Diary
        </Text>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.xl,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressLabel: {
    ...typography.bodyMd,
  },
  dayDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  whyCard: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  whyText: {
    ...typography.bodyMd,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  diaryBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  diaryBtnText: {
    ...typography.button,
    fontFamily: fontFamily.semiBold,
  },
});
