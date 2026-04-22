import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

// expo-notifications throws on require in Expo Go SDK 53+ (Android).
// Detect Expo Go via Constants before requiring to avoid the side-effect throw.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime optional module
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch {
    logger.warn('expo-notifications not available');
  }
} else {
  logger.warn('expo-notifications skipped — running in Expo Go');
}

const REMINDER_ID_PREFIX = 'diary-reminder-';
const NOTIFICATION_IDS_KEY = 'notification_ids';
const MAX_STORED_IDS = 60;

const REMINDER_MESSAGES = [
  "Hey 👋 how's your day going? Take 2 minutes to capture it.",
  'What happened today worth remembering? 📔',
  'Your future self will thank you for writing this down 🌱',
  "Quick check-in time ✨ What's on your mind?",
  "Two minutes to capture today. You've got this 💪",
  "What made today interesting? Write it down before you forget 🧠",
  'Evening reflection time 🌙 What are you taking away from today?',
  'The best journalers just write. No pressure, just capture 📝',
];

if (Platform.OS === 'android' && Notifications) {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Founder Diaries',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366f1',
  });
}

function randomIntBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMessage(): string {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
}

async function loadStoredIds(): Promise<string[]> {
  try {
    const raw = await SecureStore.getItemAsync(NOTIFICATION_IDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function saveIds(ids: string[]): Promise<void> {
  const trimmed = ids.slice(-MAX_STORED_IDS);
  await SecureStore.setItemAsync(NOTIFICATION_IDS_KEY, JSON.stringify(trimmed));
}

async function cancelByPrefix(prefix: string): Promise<void> {
  if (!Notifications) return;
  const stored = await loadStoredIds();
  const matching = stored.filter((id) => id.startsWith(prefix));
  await Promise.all(matching.map((id) => Notifications!.cancelScheduledNotificationAsync(id)));
  const remaining = stored.filter((id) => !id.startsWith(prefix));
  await saveIds(remaining);
  logger.debug('Cancelled notifications by prefix', { prefix, count: matching.length });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  const granted = status === 'granted';
  logger.info('Notification permissions requested', { granted });
  return granted;
}

export async function scheduleReminders(enabled: boolean): Promise<void> {
  await cancelByPrefix(REMINDER_ID_PREFIX);

  if (!enabled || !Notifications) {
    logger.info('Reminders disabled or notifications unavailable');
    return;
  }

  const newIds: string[] = [];
  const now = new Date();

  for (let day = 0; day < 30; day++) {
    const morningDate = new Date(now);
    morningDate.setDate(now.getDate() + day);
    morningDate.setHours(randomIntBetween(8, 10), randomIntBetween(0, 59), 0, 0);

    const eveningDate = new Date(now);
    eveningDate.setDate(now.getDate() + day);
    eveningDate.setHours(randomIntBetween(18, 20), randomIntBetween(0, 59), 0, 0);

    if (morningDate > now) {
      const morningId = await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_ID_PREFIX}morning-day${day}`,
        content: {
          title: 'Founder Diaries',
          body: randomMessage(),
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morningDate },
      });
      newIds.push(morningId);
    }

    if (eveningDate > now) {
      const eveningId = await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_ID_PREFIX}evening-day${day}`,
        content: {
          title: 'Founder Diaries',
          body: randomMessage(),
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eveningDate },
      });
      newIds.push(eveningId);
    }
  }

  const existing = await loadStoredIds();
  await saveIds([...existing, ...newIds]);

  logger.info('Reminders scheduled', { count: newIds.length });
}

export async function scheduleEnrichmentQuestion(
  question: string,
  questionId: string,
): Promise<void> {
  if (!Notifications) return;
  const now = new Date();
  const scheduledDate = new Date(now);

  const isPastWindow = now.getHours() >= 18;
  if (isPastWindow) {
    scheduledDate.setDate(now.getDate() + 1);
  }

  scheduledDate.setHours(randomIntBetween(10, 18), randomIntBetween(0, 59), 0, 0);

  const body = question.length > 100 ? `${question.slice(0, 97)}...` : question;
  const identifier = `enrichment-question-${questionId}`;

  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: 'Quick question for you 🤔',
      body,
      data: { type: 'enrichment_question', questionId },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: scheduledDate },
  });

  const existing = await loadStoredIds();
  await saveIds([...existing, identifier]);

  logger.info('Enrichment question scheduled', { questionId, scheduledDate: scheduledDate.toISOString() });
}

export async function cancelEnrichmentQuestion(questionId: string): Promise<void> {
  if (!Notifications) return;
  const identifier = `enrichment-question-${questionId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier);

  const existing = await loadStoredIds();
  await saveIds(existing.filter((id) => id !== identifier));

  logger.debug('Enrichment question notification cancelled', { questionId });
}

export function setupNotificationHandler(): void {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  logger.debug('Notification handler configured');
}

export async function getNotificationResponse(): Promise<import('expo-notifications').NotificationResponse | null> {
  if (!Notifications) return null;
  return Notifications.getLastNotificationResponseAsync();
}

export async function registerPushToken(userId: string): Promise<void> {
  if (!Notifications) return;
  if (Platform.OS === 'web') return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      logger.info('Push token registration skipped — permissions not granted');
      return;
    }

    // Resolve EAS projectId — populated in production builds
    const projectId =
      (Constants.easConfig as Record<string, string> | undefined)?.projectId ??
      ((Constants.expoConfig?.extra as Record<string, Record<string, string>> | undefined)?.eas?.projectId);

    if (!projectId) {
      logger.warn('Cannot register push token — EAS projectId not configured');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    logger.info('Push token registered', { userId });
  } catch (err) {
    // Non-fatal — push token registration is best-effort
    logger.warn('Push token registration failed', { error: String(err) });
  }
}
