import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Platform, ContentType, PlatformConfig } from '@/types/database';

interface PlatformState {
  id: string | null;
  platform: Platform;
  active: boolean;
  weekly_post_quota: number;
  preferred_content_types: ContentType[];
}

const PLATFORM_DISPLAY: Record<Platform, { label: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', icon: '💼' },
  instagram: { label: 'Instagram', icon: '📸' },
  x: { label: 'X (Twitter)', icon: '✖️' },
};

const CONTENT_TYPES_BY_PLATFORM: Record<Platform, ContentType[]> = {
  linkedin: ['post', 'carousel'],
  instagram: ['post', 'carousel', 'reel_caption'],
  x: ['post', 'thread'],
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: 'Post',
  carousel: 'Carousel',
  thread: 'Thread',
  reel_caption: 'Reel Caption',
};

const DEFAULT_PLATFORMS: PlatformState[] = [
  { id: null, platform: 'linkedin', active: false, weekly_post_quota: 3, preferred_content_types: ['post'] },
  { id: null, platform: 'instagram', active: false, weekly_post_quota: 3, preferred_content_types: ['post'] },
  { id: null, platform: 'x', active: false, weekly_post_quota: 3, preferred_content_types: ['post'] },
];

export default function PlatformsScreen() {
  const session = useAuthStore((s) => s.session);
  const [platforms, setPlatforms] = useState<PlatformState[]>(DEFAULT_PLATFORMS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingPlatform, setSavingPlatform] = useState<Platform | null>(null);

  const fetchConfigs = useCallback(async () => {
    if (!session?.user.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('platform_configs')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        logger.error('Failed to fetch platform configs', { error: error.message });
        return;
      }

      setPlatforms((prev) =>
        prev.map((p) => {
          const config = (data ?? []).find(
            (c: PlatformConfig) => c.platform === p.platform,
          ) as PlatformConfig | undefined;
          if (!config) return p;
          return {
            ...p,
            id: config.id,
            active: config.active,
            weekly_post_quota: config.weekly_post_quota,
            preferred_content_types: (config.preferred_content_types ?? ['post']) as ContentType[],
          };
        }),
      );
    } catch (err) {
      logger.error('Unexpected error fetching platform configs', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const saveConfig = useCallback(
    async (updated: PlatformState) => {
      if (!session?.user.id) return;
      setSavingPlatform(updated.platform);

      try {
        if (updated.id) {
          const { error } = await supabase
            .from('platform_configs')
            .update({
              active: updated.active,
              weekly_post_quota: updated.weekly_post_quota,
              preferred_content_types: updated.preferred_content_types,
              updated_at: new Date().toISOString(),
            })
            .eq('id', updated.id);

          if (error) {
            logger.error('Failed to update platform config', { error: error.message });
          }
        } else {
          const { data, error } = await supabase
            .from('platform_configs')
            .insert({
              user_id: session.user.id,
              platform: updated.platform,
              active: updated.active,
              weekly_post_quota: updated.weekly_post_quota,
              preferred_content_types: updated.preferred_content_types,
            })
            .select('id')
            .single();

          if (error) {
            logger.error('Failed to create platform config', { error: error.message });
          } else if (data) {
            setPlatforms((prev) =>
              prev.map((p) => (p.platform === updated.platform ? { ...p, id: data.id } : p)),
            );
          }
        }
      } catch (err) {
        logger.error('Unexpected error saving platform config', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setSavingPlatform(null);
      }
    },
    [session?.user.id],
  );

  const handleToggle = useCallback(
    (platform: Platform, value: boolean) => {
      setPlatforms((prev) => {
        const updated = prev.map((p) =>
          p.platform === platform ? { ...p, active: value } : p,
        );
        const target = updated.find((p) => p.platform === platform);
        if (target) saveConfig(target);
        return updated;
      });
    },
    [saveConfig],
  );

  const handleQuotaChange = useCallback(
    (platform: Platform, quota: number) => {
      setPlatforms((prev) => {
        const updated = prev.map((p) =>
          p.platform === platform ? { ...p, weekly_post_quota: quota } : p,
        );
        const target = updated.find((p) => p.platform === platform);
        if (target) saveConfig(target);
        return updated;
      });
    },
    [saveConfig],
  );

  const handleContentTypeToggle = useCallback(
    (platform: Platform, type: ContentType, enabled: boolean) => {
      setPlatforms((prev) => {
        const updated = prev.map((p) => {
          if (p.platform !== platform) return p;
          const types = enabled
            ? [...p.preferred_content_types, type]
            : p.preferred_content_types.filter((t) => t !== type);
          return { ...p, preferred_content_types: types };
        });
        const target = updated.find((p) => p.platform === platform);
        if (target) saveConfig(target);
        return updated;
      });
    },
    [saveConfig],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HeaderBar title="Platforms & Quotas" showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="platforms-screen">
      <HeaderBar title="Platforms & Quotas" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {platforms.map((p) => {
          const display = PLATFORM_DISPLAY[p.platform];
          const availableTypes = CONTENT_TYPES_BY_PLATFORM[p.platform];
          const isSaving = savingPlatform === p.platform;

          return (
            <View
              key={p.platform}
              style={[styles.platformCard, !p.active && styles.platformCardInactive]}
              testID={`platform-card-${p.platform}`}
            >
              {/* Header row */}
              <View style={styles.platformHeader}>
                <View style={styles.platformLeft}>
                  <Text style={styles.platformIcon}>{display.icon}</Text>
                  <Text style={[styles.platformLabel, !p.active && styles.platformLabelInactive]}>
                    {display.label}
                  </Text>
                  {isSaving && (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary[500]}
                      testID={`saving-indicator-${p.platform}`}
                    />
                  )}
                </View>
                <Switch
                  value={p.active}
                  onValueChange={(val) => handleToggle(p.platform, val)}
                  trackColor={{ false: colors.gray[200], true: colors.primary[500] }}
                  thumbColor={colors.white}
                  testID={`platform-toggle-${p.platform}`}
                />
              </View>

              {/* Expanded settings when active */}
              {p.active && (
                <View style={styles.platformSettings}>
                  {/* Weekly quota */}
                  <View style={styles.quotaSection}>
                    <Text style={styles.settingLabel}>
                      Weekly quota:{' '}
                      <Text style={styles.settingValue}>{p.weekly_post_quota}/week</Text>
                    </Text>
                    <View style={styles.quotaNumbers} testID={`quota-picker-${p.platform}`}>
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <Pressable
                          key={num}
                          style={[
                            styles.quotaNumber,
                            p.weekly_post_quota === num && styles.quotaNumberSelected,
                          ]}
                          onPress={() => handleQuotaChange(p.platform, num)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: p.weekly_post_quota === num }}
                          testID={`quota-${p.platform}-${num}`}
                        >
                          <Text
                            style={[
                              styles.quotaNumberText,
                              p.weekly_post_quota === num && styles.quotaNumberTextSelected,
                            ]}
                          >
                            {num}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Content types */}
                  <View style={styles.contentTypesSection}>
                    <Text style={styles.settingLabel}>Content types:</Text>
                    <View style={styles.contentTypesGrid}>
                      {availableTypes.map((type) => {
                        const isChecked = p.preferred_content_types.includes(type);
                        return (
                          <Pressable
                            key={type}
                            style={[
                              styles.contentTypeChip,
                              isChecked && styles.contentTypeChipSelected,
                            ]}
                            onPress={() =>
                              handleContentTypeToggle(p.platform, type, !isChecked)
                            }
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isChecked }}
                            testID={`content-type-${p.platform}-${type}`}
                          >
                            <Text
                              style={[
                                styles.contentTypeText,
                                isChecked && styles.contentTypeTextSelected,
                              ]}
                            >
                              {isChecked ? '✓ ' : ''}{CONTENT_TYPE_LABELS[type]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  platformCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  platformCardInactive: {
    opacity: 0.7,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platformIcon: {
    fontSize: 24,
  },
  platformLabel: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  platformLabelInactive: {
    color: colors.gray[400],
  },
  platformSettings: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  quotaSection: {
    gap: spacing.sm,
  },
  settingLabel: {
    ...typography.bodyMd,
    color: colors.gray[700],
  },
  settingValue: {
    fontWeight: '600',
    color: colors.primary[500],
  },
  quotaNumbers: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quotaNumber: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  quotaNumberSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  quotaNumberText: {
    ...typography.bodySm,
    color: colors.gray[700],
    fontWeight: '600',
  },
  quotaNumberTextSelected: {
    color: colors.primary[600],
  },
  contentTypesSection: {
    gap: spacing.sm,
  },
  contentTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contentTypeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: 'transparent',
  },
  contentTypeChipSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  contentTypeText: {
    ...typography.bodySm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  contentTypeTextSelected: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
