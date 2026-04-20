import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, StepDots } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

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
      { id: 'carousel', label: 'Carousel (Coming Soon)' },
    ],
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    emoji: '🐦',
    contentTypes: [
      { id: 'post', label: 'Post' },
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
  const { colors } = useTheme();
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
      pathname: '/(onboarding)/image-style',
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="platform-setup-screen"
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
          Where do you want to post?
        </Text>

        <View style={styles.platformList} testID="platform-list">
          {PLATFORMS.map((platform) => {
            const state = platforms[platform.id];
            return (
              <View
                key={platform.id}
                style={[
                  styles.platformCard,
                  {
                    borderColor: state.enabled ? colors.accent : colors.border,
                    backgroundColor: state.enabled ? colors.accentLight : colors.surface,
                    borderRadius: borderRadius.lg,
                  },
                ]}
                testID={`platform-card-${platform.id}`}
              >
                {/* Platform header row */}
                <View style={styles.platformHeader}>
                  <View style={styles.platformInfo}>
                    <Text style={styles.platformEmoji}>{platform.emoji}</Text>
                    <Text style={[typography.headingSm, { color: colors.textPrimary }]}>
                      {platform.name}
                    </Text>
                  </View>
                  <Switch
                    value={state.enabled}
                    onValueChange={(val) => togglePlatform(platform.id, val)}
                    trackColor={{
                      false: colors.border,
                      true: colors.accent,
                    }}
                    thumbColor={colors.white}
                    accessibilityLabel={`Toggle ${platform.name}`}
                    testID={`platform-toggle-${platform.id}`}
                  />
                </View>

                {/* Content types when enabled */}
                {state.enabled ? (
                  <View
                    style={[
                      styles.contentTypes,
                      { borderTopColor: colors.border },
                    ]}
                    testID={`content-types-${platform.id}`}
                  >
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
                          <View
                            style={[
                              styles.checkbox,
                              {
                                borderRadius: borderRadius.sm,
                                borderColor: isChecked ? colors.accent : colors.border,
                                backgroundColor: isChecked ? colors.accent : colors.surface,
                              },
                            ]}
                          >
                            {isChecked ? (
                              <Text
                                style={[styles.checkmark, { color: colors.accentText }]}
                              >
                                ✓
                              </Text>
                            ) : null}
                          </View>
                          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
                            {ct.label}
                          </Text>
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
  platformList: {
    gap: spacing.md,
  },
  platformCard: {
    borderWidth: 1.5,
    padding: spacing.lg,
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
  contentTypes: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
  },
});
