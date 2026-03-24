import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, StepDots, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

interface EnabledPlatform {
  id: string;
  contentTypes: string[];
}

const POST_COUNTS = [1, 2, 3, 4, 5, 6, 7] as const;
type PostCount = (typeof POST_COUNTS)[number];

export default function QuotaConfigScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{
    industry: string;
    keywords: string;
    platforms: string;
  }>();

  const { session, setProfile } = useAuthStore();

  const enabledPlatforms: EnabledPlatform[] = React.useMemo(() => {
    try {
      return JSON.parse(params.platforms ?? '[]') as EnabledPlatform[];
    } catch {
      return [];
    }
  }, [params.platforms]);

  const [quotas, setQuotas] = useState<Record<string, PostCount>>(() => {
    const initial: Record<string, PostCount> = {};
    enabledPlatforms.forEach((p) => {
      initial[p.id] = 3;
    });
    return initial;
  });

  const [isLoading, setIsLoading] = useState(false);

  function setQuota(platformId: string, count: PostCount) {
    setQuotas((prev) => ({ ...prev, [platformId]: count }));
  }

  async function handleStart() {
    if (!session?.user) {
      toast.show('Session expired. Please sign in again.', 'error');
      router.replace('/(auth)/sign-in');
      return;
    }

    const userId = session.user.id;
    const keywords: string[] = (() => {
      try {
        return JSON.parse(params.keywords ?? '[]') as string[];
      } catch {
        return [];
      }
    })();

    setIsLoading(true);
    try {
      // Update profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          industry: params.industry ?? null,
          niche_keywords: keywords,
          onboarding_completed: true,
          diary_start_date: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) {
        toast.show('Failed to save your preferences. Please try again.', 'error');
        return;
      }

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // Create platform_config rows
      const platformRows = enabledPlatforms.map((p) => ({
        user_id: userId,
        platform: p.id,
        weekly_post_quota: quotas[p.id] ?? 3,
        preferred_content_types: p.contentTypes,
        is_active: true,
      }));

      if (platformRows.length > 0) {
        const { error: platformError } = await supabase
          .from('platform_configs')
          .upsert(platformRows, { onConflict: 'user_id,platform' });

        if (platformError) {
          toast.show('Platform settings could not be saved, but you can update them later.', 'warning');
        }
      }

      router.replace('/(tabs)/diary');
    } catch {
      toast.show('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="quota-config-screen"
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
        >
          <Text style={[typography.bodyMd, { color: colors.accent, fontFamily: fontFamily.medium }]}>
            ← Back
          </Text>
        </Pressable>

        <Text style={[typography.headingXl, { color: colors.textPrimary }]}>
          How often do you want to post?
        </Text>

        {enabledPlatforms.length === 0 ? (
          <View
            style={[
              styles.emptyNote,
              {
                backgroundColor: colors.surface2,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            testID="no-platforms-note"
          >
            <Text style={[typography.bodyMd, { color: colors.textSecondary, textAlign: 'center' }]}>
              No platforms selected. Go back and enable at least one.
            </Text>
          </View>
        ) : (
          <View style={styles.quotaList} testID="quota-list">
            {enabledPlatforms.map((platform) => {
              const currentQuota = quotas[platform.id] ?? 3;
              return (
                <View
                  key={platform.id}
                  style={[
                    styles.quotaCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                  testID={`quota-row-${platform.id}`}
                >
                  <View style={styles.quotaCardHeader}>
                    <Text style={[typography.headingSm, { color: colors.textPrimary }]}>
                      {platform.id.charAt(0).toUpperCase() + platform.id.slice(1)}
                    </Text>
                    <Text
                      style={[
                        typography.numericMd,
                        { color: colors.accent, fontFamily: fontFamily.bold },
                      ]}
                    >
                      {currentQuota}
                      <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
                        /week
                      </Text>
                    </Text>
                  </View>

                  {/* Stepper row */}
                  <View style={styles.stepperRow} testID={`quota-selector-${platform.id}`}>
                    {/* Minus */}
                    <Pressable
                      onPress={() => {
                        const idx = POST_COUNTS.indexOf(currentQuota);
                        if (idx > 0) setQuota(platform.id, POST_COUNTS[idx - 1]);
                      }}
                      style={[
                        styles.stepperButton,
                        {
                          backgroundColor: colors.surface2,
                          borderColor: colors.border,
                          borderRadius: borderRadius.sm,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease posts per week"
                      testID={`quota-minus-${platform.id}`}
                    >
                      <Text
                        style={[
                          styles.stepperIcon,
                          { color: colors.textPrimary, fontFamily: fontFamily.bold },
                        ]}
                      >
                        −
                      </Text>
                    </Pressable>

                    {/* Count chips */}
                    <View style={styles.countRow}>
                      {POST_COUNTS.map((count) => (
                        <Pressable
                          key={count}
                          onPress={() => setQuota(platform.id, count)}
                          style={[
                            styles.countButton,
                            {
                              borderRadius: borderRadius.sm,
                              borderWidth: 1.5,
                              borderColor: currentQuota === count ? colors.accent : colors.border,
                              backgroundColor:
                                currentQuota === count ? colors.accent : colors.surface2,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: currentQuota === count }}
                          accessibilityLabel={`${count} posts per week`}
                          testID={`quota-count-${platform.id}-${count}`}
                        >
                          <Text
                            style={[
                              typography.bodyMd,
                              {
                                fontFamily: fontFamily.semibold,
                                color:
                                  currentQuota === count ? colors.accentText : colors.textPrimary,
                              },
                            ]}
                          >
                            {count}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Plus */}
                    <Pressable
                      onPress={() => {
                        const idx = POST_COUNTS.indexOf(currentQuota);
                        if (idx < POST_COUNTS.length - 1) setQuota(platform.id, POST_COUNTS[idx + 1]);
                      }}
                      style={[
                        styles.stepperButton,
                        {
                          backgroundColor: colors.surface2,
                          borderColor: colors.border,
                          borderRadius: borderRadius.sm,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Increase posts per week"
                      testID={`quota-plus-${platform.id}`}
                    >
                      <Text
                        style={[
                          styles.stepperIcon,
                          { color: colors.textPrimary, fontFamily: fontFamily.bold },
                        ]}
                      >
                        +
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text
          style={[typography.bodySm, { color: colors.textMuted, textAlign: 'center' }]}
        >
          You can always change this later in settings.
        </Text>

        <Button
          label="Start My Diary"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={enabledPlatforms.length === 0}
          onPress={handleStart}
          testID="start-diary-button"
        />

        <StepDots total={4} current={3} testID="quota-step-dots" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  quotaList: {
    gap: spacing.lg,
  },
  quotaCard: {
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  quotaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  countRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  countButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNote: {
    padding: spacing.lg,
    borderWidth: 1,
  },
});
