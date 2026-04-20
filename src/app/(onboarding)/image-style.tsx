import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StepDots } from '@/components/ui/StepDots';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

type ImageStyle = 'professional' | 'sketch' | 'minimalist';

interface StyleCardData {
  value: ImageStyle;
  emoji: string;
  title: string;
  description: string;
  preview: string;
}

const STYLE_CARDS: StyleCardData[] = [
  {
    value: 'professional',
    emoji: '🏢',
    title: 'Professional',
    description: 'Clean gradients, icons, and data visualizations. Perfect for LinkedIn thought leadership.',
    preview: 'Bar chart · Gradient banner · Icon grid',
  },
  {
    value: 'sketch',
    emoji: '✏️',
    title: 'Hand-drawn / Sketch',
    description: 'Hand-drawn whiteboard illustrations. Feels authentic and personal, like napkin sketches.',
    preview: 'Rough lines · Whiteboard marks · Doodle frames',
  },
  {
    value: 'minimalist',
    emoji: '◼',
    title: 'Minimalist',
    description: 'Bold text on solid colors. High contrast, clean, and statement-making.',
    preview: 'Solid fill · Big type · No clutter',
  },
];

export default function ImageStyleScreen() {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const session = useAuthStore((s) => s.session);
  const params = useLocalSearchParams<{
    industry: string;
    keywords: string;
    platforms: string;
  }>();

  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('professional');
  const [isSaving, setIsSaving] = useState(false);

  async function handleContinue(): Promise<void> {
    const userId = session?.user.id;
    if (!userId) {
      logger.warn('image-style: no authenticated user, skipping profile update');
      router.push({
        pathname: '/(onboarding)/quota-config',
        params: {
          industry: params.industry ?? '',
          keywords: params.keywords ?? '[]',
          platforms: params.platforms ?? '[]',
        },
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ image_style: selectedStyle })
        .eq('id', userId);

      if (error) {
        logger.error('image-style: failed to save image_style', { error: error.message, userId });
      } else {
        logger.info('image-style: saved image_style', { style: selectedStyle, userId });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('image-style: unexpected error', { error: message });
    } finally {
      setIsSaving(false);
      router.push({
        pathname: '/(onboarding)/quota-config',
        params: {
          industry: params.industry ?? '',
          keywords: params.keywords ?? '[]',
          platforms: params.platforms ?? '[]',
        },
      });
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="image-style-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-button"
          hitSlop={8}
        >
          <Text style={[typography.bodyMd, { color: colors.accent, fontFamily: fontFamily.medium }]}>
            ← Back
          </Text>
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.headingXl, { color: colors.textPrimary }]}>
            Pick your visual style
          </Text>
          <Text style={[typography.bodyLg, { color: colors.textSecondary }]}>
            We'll use this when generating images for your posts
          </Text>
        </View>

        {/* Style cards */}
        <View style={styles.cardList} testID="style-card-list">
          {STYLE_CARDS.map((card) => {
            const isSelected = selectedStyle === card.value;
            return (
              <Pressable
                key={card.value}
                onPress={() => setSelectedStyle(card.value)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isSelected ? colors.accentLight : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderRadius: borderRadius.lg,
                    opacity: pressed ? 0.85 : 1,
                  },
                  isSelected ? shadows.sm : {},
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${card.title} image style`}
                testID={`style-card-${card.value}`}
              >
                {/* Top row: emoji + title + checkmark */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardEmoji} accessibilityElementsHidden>
                    {card.emoji}
                  </Text>
                  <Text
                    style={[
                      typography.headingSm,
                      {
                        color: isSelected ? colors.accent : colors.textPrimary,
                        flex: 1,
                      },
                    ]}
                  >
                    {card.title}
                  </Text>
                  {isSelected && (
                    <Text
                      style={[styles.checkmark, { color: colors.accent }]}
                      accessibilityElementsHidden
                    >
                      ✓
                    </Text>
                  )}
                </View>

                {/* Description */}
                <Text
                  style={[
                    typography.bodyMd,
                    {
                      color: colors.textSecondary,
                      marginTop: spacing.xs,
                    },
                  ]}
                >
                  {card.description}
                </Text>

                {/* Preview concept chip */}
                <View
                  style={[
                    styles.previewChip,
                    {
                      backgroundColor: isSelected ? colors.warmSurface : colors.surface2,
                      borderColor: isSelected ? colors.warmBorder : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? colors.warmMedium : colors.textMuted,
                        fontFamily: fontFamily.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {card.preview}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <StepDots total={4} current={2} testID="image-style-step-dots" />
          <Pressable
            onPress={handleContinue}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.continueButton,
              {
                backgroundColor: isSaving ? colors.accentHover : colors.accent,
                borderRadius: borderRadius.lg,
                opacity: pressed || isSaving ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue to quota setup"
            accessibilityState={{ disabled: isSaving }}
            testID="continue-button"
          >
            <Text style={[typography.button, { color: colors.accentText }]}>
              {isSaving ? 'Saving…' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  header: {
    gap: spacing.sm,
  },
  cardList: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1.5,
    padding: spacing.lg,
    minHeight: 44,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
  },
  footer: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  continueButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 44,
  },
});
