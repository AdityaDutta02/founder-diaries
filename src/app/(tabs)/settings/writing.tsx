import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui';
import { logger } from '@/lib/logger';
import {
  getWritingInstructions,
  upsertWritingInstruction,
} from '@/services/supabaseService';
import type { Platform } from '@/types/database';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
];

const PLACEHOLDER_TEXT =
  'Write your custom instructions here. These will guide the AI when generating content for this platform.\n\nExamples:\n- Always open with a personal story\n- Never use hashtags in the body text\n- Keep sentences under 20 words\n- Use a conversational, first-person tone\n- Reference my startup journey when relevant';

export default function WritingStyleScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const userId = useAuthStore((s) => s.session?.user.id);

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('linkedin');
  const [instructions, setInstructions] = useState<Record<Platform, string>>({
    linkedin: '',
    instagram: '',
    x: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getWritingInstructions(userId!);
        if (cancelled) return;
        const map: Record<Platform, string> = { linkedin: '', instagram: '', x: '' };
        for (const row of data) {
          map[row.platform] = row.instructions;
        }
        setInstructions(map);
      } catch (err) {
        logger.error('Failed to load writing instructions', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await upsertWritingInstruction(userId, selectedPlatform, instructions[selectedPlatform]);
      toast.show('Writing instructions saved', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.show(message, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [userId, selectedPlatform, instructions, toast]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="writing-style-screen"
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" testID="back-btn">
          <Text style={[styles.backText, { color: colors.accent }]}>{'< Back'}</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Writing Style</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
          Add custom instructions to guide how AI generates content for each platform.
          These are combined with the writing profiles learned from top creators.
        </Text>

        {/* Platform tabs */}
        <View style={styles.platformTabs}>
          {PLATFORMS.map((p) => {
            const isActive = selectedPlatform === p.value;
            return (
              <Pressable
                key={p.value}
                style={[
                  styles.platformTab,
                  {
                    backgroundColor: isActive ? colors.accent : colors.surface2,
                    borderColor: isActive ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setSelectedPlatform(p.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                testID={`tab-${p.value}`}
              >
                <Text
                  style={[
                    styles.platformTabText,
                    { color: isActive ? colors.accentText : colors.textSecondary },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Instructions input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              { color: colors.textPrimary },
            ]}
            value={instructions[selectedPlatform]}
            onChangeText={(text) =>
              setInstructions((prev) => ({ ...prev, [selectedPlatform]: text }))
            }
            placeholder={PLACEHOLDER_TEXT}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            testID="instructions-input"
          />
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: colors.accent,
              opacity: pressed || isSaving ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          testID="save-btn"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.accentText} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.accentText }]}>
              Save Instructions
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backText: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  platformTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  platformTabText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    minHeight: 200,
  },
  textInput: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    padding: spacing.md,
    minHeight: 200,
  },
  saveBtn: {
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
});
