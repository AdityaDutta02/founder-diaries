import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import {
  scheduleReminders,
  requestNotificationPermissions,
} from '@/services/notificationService';
import { logger } from '@/lib/logger';

const STORAGE_KEY_REMINDERS = 'notifications_reminders_enabled';
const STORAGE_KEY_QUESTIONS = 'notifications_questions_enabled';
const STORAGE_KEY_PERMISSIONS_REQUESTED = 'notifications_permissions_requested';

export default function NotificationsScreen() {
  const { colors } = useTheme();

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [questionsEnabled, setQuestionsEnabled] = useState(true);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const [remindersRaw, questionsRaw] = await Promise.all([
          SecureStore.getItemAsync(STORAGE_KEY_REMINDERS),
          SecureStore.getItemAsync(STORAGE_KEY_QUESTIONS),
        ]);
        if (remindersRaw !== null) {
          setRemindersEnabled(remindersRaw === 'true');
        }
        if (questionsRaw !== null) {
          setQuestionsEnabled(questionsRaw === 'true');
        }
      } catch (err) {
        logger.warn('Failed to load notification preferences', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    void loadPrefs();
  }, []);

  const handleRemindersToggle = useCallback(async (value: boolean) => {
    setIsLoadingReminders(true);
    try {
      if (value) {
        // Request permissions the first time user enables reminders
        const alreadyRequested = await SecureStore.getItemAsync(STORAGE_KEY_PERMISSIONS_REQUESTED);
        if (!alreadyRequested) {
          const granted = await requestNotificationPermissions();
          await SecureStore.setItemAsync(STORAGE_KEY_PERMISSIONS_REQUESTED, 'true');
          if (!granted) {
            Alert.alert(
              'Permissions Denied',
              'Please enable notifications in your device settings to receive diary reminders.',
            );
            return;
          }
        }
      }

      setRemindersEnabled(value);
      await SecureStore.setItemAsync(STORAGE_KEY_REMINDERS, String(value));
      await scheduleReminders(value);
    } catch (err) {
      logger.error('Failed to update reminder preference', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoadingReminders(false);
    }
  }, []);

  const handleQuestionsToggle = useCallback(async (value: boolean) => {
    try {
      setQuestionsEnabled(value);
      await SecureStore.setItemAsync(STORAGE_KEY_QUESTIONS, String(value));
    } catch (err) {
      logger.warn('Failed to persist questions preference', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="notifications-screen"
    >
      <HeaderBar title="Notifications" showBack />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Diary Reminders Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            Diary Reminders
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={[typography.bodyLg, { color: colors.textPrimary }]}>
                  Daily diary reminders
                </Text>
                {remindersEnabled && (
                  <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                    We&apos;ll remind you twice a day to write
                  </Text>
                )}
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={(val) => void handleRemindersToggle(val)}
                disabled={isLoadingReminders}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
                testID="reminders-toggle"
              />
            </View>
          </View>
        </View>

        {/* Enrichment Questions Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            Enrichment Questions
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={[typography.bodyLg, { color: colors.textPrimary }]}>
                  Occasional questions
                </Text>
                <Text style={[typography.bodySm, { color: colors.textSecondary }]}>
                  Friendly questions to help personalise your content
                </Text>
              </View>
              <Switch
                value={questionsEnabled}
                onValueChange={(val) => void handleQuestionsToggle(val)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
                testID="questions-toggle"
              />
            </View>
            <View
              style={[
                styles.infoContainer,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[typography.bodyMd, { color: colors.textSecondary, lineHeight: 20 }]}>
                These are casual questions - like what your morning routine looks like or what you
                wanted to be as a kid. Never about content strategy.
              </Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            About
          </Text>
          <View
            style={[
              styles.aboutCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text style={[typography.bodyMd, { color: colors.textSecondary, lineHeight: 22 }]}>
              As you write, we quietly build an understanding of who you are - your story, values,
              and voice. This helps your generated content feel genuinely like you, not like it was
              written by a robot.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  infoContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  aboutCard: {
    padding: spacing.lg,
    borderWidth: 1,
  },
});
