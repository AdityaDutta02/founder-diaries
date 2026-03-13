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
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface EnabledPlatform {
  id: string;
  contentTypes: string[];
}

const POST_COUNTS = [1, 2, 3, 4, 5, 6, 7] as const;
type PostCount = (typeof POST_COUNTS)[number];

export default function QuotaConfigScreen() {
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
        weekly_quota: quotas[p.id] ?? 3,
        content_types: p.contentTypes,
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

      router.replace('/(tabs)');
    } catch (err) {
      toast.show('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} testID="quota-config-screen">
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
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>How often do you want to post?</Text>

        {enabledPlatforms.length === 0 ? (
          <View style={styles.emptyNote} testID="no-platforms-note">
            <Text style={styles.emptyNoteText}>
              No platforms selected. Go back and enable at least one.
            </Text>
          </View>
        ) : (
          <View style={styles.quotaList} testID="quota-list">
            {enabledPlatforms.map((platform) => {
              const currentQuota = quotas[platform.id] ?? 3;
              return (
                <View key={platform.id} style={styles.quotaRow} testID={`quota-row-${platform.id}`}>
                  <Text style={styles.platformLabel}>
                    {platform.id.charAt(0).toUpperCase() + platform.id.slice(1)}
                  </Text>
                  <Text style={styles.quotaValue}>{currentQuota}/week</Text>
                  <View style={styles.countRow} testID={`quota-selector-${platform.id}`}>
                    {POST_COUNTS.map((count) => (
                      <Pressable
                        key={count}
                        onPress={() => setQuota(platform.id, count)}
                        style={[
                          styles.countButton,
                          currentQuota === count && styles.countButtonActive,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: currentQuota === count }}
                        accessibilityLabel={`${count} posts per week`}
                        testID={`quota-count-${platform.id}-${count}`}
                      >
                        <Text
                          style={[
                            styles.countLabel,
                            currentQuota === count && styles.countLabelActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.helperText}>You can always change this later in settings.</Text>

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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
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
  },
  backText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '500',
  },
  heading: {
    ...typography.headingXl,
    color: colors.gray[900],
  },
  quotaList: {
    gap: spacing['2xl'],
  },
  quotaRow: {
    gap: spacing.md,
  },
  platformLabel: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  quotaValue: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
  countRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  countButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  countLabel: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.gray[700],
  },
  countLabelActive: {
    color: colors.white,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.gray[400],
    textAlign: 'center',
  },
  emptyNote: {
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  emptyNoteText: {
    ...typography.bodyMd,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
