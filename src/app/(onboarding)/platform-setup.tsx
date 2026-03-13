import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button, StepDots } from '@/components/ui';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type PlatformId = 'linkedin' | 'instagram' | 'x';

interface ContentTypeOption {
  id: string;
  label: string;
}

interface PlatformConfig {
  id: PlatformId;
  name: string;
  emoji: string;
  contentTypes: ContentTypeOption[];
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    emoji: '💼',
    contentTypes: [
      { id: 'post', label: 'Post' },
      { id: 'carousel', label: 'Carousel' },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    contentTypes: [
      { id: 'post', label: 'Post' },
      { id: 'carousel', label: 'Carousel' },
      { id: 'reel_caption', label: 'Reel Caption' },
    ],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    emoji: '🐦',
    contentTypes: [
      { id: 'tweet', label: 'Tweet' },
      { id: 'thread', label: 'Thread' },
    ],
  },
];

interface PlatformState {
  enabled: boolean;
  selectedContentTypes: Set<string>;
}

type PlatformsState = Record<PlatformId, PlatformState>;

function buildInitialState(): PlatformsState {
  return {
    linkedin: { enabled: false, selectedContentTypes: new Set() },
    instagram: { enabled: false, selectedContentTypes: new Set() },
    x: { enabled: false, selectedContentTypes: new Set() },
  };
}

export default function PlatformSetupScreen() {
  const params = useLocalSearchParams<{ industry: string; keywords: string }>();
  const [platforms, setPlatforms] = useState<PlatformsState>(buildInitialState);

  function togglePlatform(id: PlatformId, value: boolean) {
    setPlatforms((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: value },
    }));
  }

  function toggleContentType(platformId: PlatformId, typeId: string) {
    setPlatforms((prev) => {
      const current = prev[platformId];
      const next = new Set(current.selectedContentTypes);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return { ...prev, [platformId]: { ...current, selectedContentTypes: next } };
    });
  }

  function handleNext() {
    const enabledPlatforms = (Object.keys(platforms) as PlatformId[]).filter(
      (id) => platforms[id].enabled,
    );

    router.push({
      pathname: '/(onboarding)/quota-config',
      params: {
        industry: params.industry ?? '',
        keywords: params.keywords ?? '[]',
        platforms: JSON.stringify(
          enabledPlatforms.map((id) => ({
            id,
            contentTypes: Array.from(platforms[id].selectedContentTypes),
          })),
        ),
      },
    });
  }

  const hasAtLeastOnePlatform = (Object.keys(platforms) as PlatformId[]).some(
    (id) => platforms[id].enabled,
  );

  return (
    <SafeAreaView style={styles.container} testID="platform-setup-screen">
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

        <Text style={styles.heading}>Where do you want to post?</Text>

        <View style={styles.platformList} testID="platform-list">
          {PLATFORMS.map((platform) => {
            const state = platforms[platform.id];
            return (
              <View
                key={platform.id}
                style={[styles.platformCard, state.enabled && styles.platformCardActive]}
                testID={`platform-card-${platform.id}`}
              >
                {/* Platform header row */}
                <View style={styles.platformHeader}>
                  <View style={styles.platformInfo}>
                    <Text style={styles.platformEmoji}>{platform.emoji}</Text>
                    <Text style={styles.platformName}>{platform.name}</Text>
                  </View>
                  <Switch
                    value={state.enabled}
                    onValueChange={(val) => togglePlatform(platform.id, val)}
                    trackColor={{
                      false: colors.gray[200],
                      true: colors.primary[200],
                    }}
                    thumbColor={state.enabled ? colors.primary[500] : colors.white}
                    accessibilityLabel={`Toggle ${platform.name}`}
                    testID={`platform-toggle-${platform.id}`}
                  />
                </View>

                {/* Content types when enabled */}
                {state.enabled ? (
                  <View style={styles.contentTypes} testID={`content-types-${platform.id}`}>
                    {platform.contentTypes.map((ct) => {
                      const isChecked = state.selectedContentTypes.has(ct.id);
                      return (
                        <Pressable
                          key={ct.id}
                          style={styles.checkboxRow}
                          onPress={() => toggleContentType(platform.id, ct.id)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isChecked }}
                          accessibilityLabel={ct.label}
                          testID={`content-type-${platform.id}-${ct.id}`}
                        >
                          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked ? <Text style={styles.checkmark}>✓</Text> : null}
                          </View>
                          <Text style={styles.checkboxLabel}>{ct.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <Button
          label="Next"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!hasAtLeastOnePlatform}
          onPress={handleNext}
          testID="next-button"
        />

        <StepDots total={4} current={2} testID="platform-step-dots" />
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
  platformList: {
    gap: spacing.md,
  },
  platformCard: {
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  platformCardActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platformEmoji: {
    fontSize: 24,
  },
  platformName: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  contentTypes: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primary[100],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.bodyMd,
    color: colors.gray[700],
  },
});
