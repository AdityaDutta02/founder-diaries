import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { DiaryWeekStrip } from '@/components/diary/DiaryWeekStrip';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiscoveryCountdown } from '@/components/diary/DiscoveryCountdown';
import { useTheme } from '@/theme/ThemeContext';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeMode } from '@/stores/themeStore';
import { typography, fontFamily } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import type { LocalDiaryEntry } from '@/stores/diaryStore';

const DISCOVERY_TOTAL_DAYS = 7;

interface SectionData {
  title: string;
  dateLabel: string;
  data: LocalDiaryEntry[];
}

function sectionTitleForDate(dateStr: string): { title: string; dateLabel: string } {
  const date = parseISO(dateStr);
  if (isToday(date)) {
    return {
      title: 'TODAY',
      dateLabel: format(date, 'EEEE, MMM d').toUpperCase(),
    };
  }
  if (isYesterday(date)) {
    return {
      title: 'YESTERDAY',
      dateLabel: format(date, 'EEEE, MMM d').toUpperCase(),
    };
  }
  return {
    title: format(date, 'EEEE').toUpperCase(),
    dateLabel: format(date, 'MMMM d, yyyy').toUpperCase(),
  };
}

export default function DiaryIndexScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setMode } = useThemeStore();
  const {
    entries,
    selectedDate,
    currentMonth,
    setSelectedDate,
    setCurrentMonth,
    getEntryDates,
    getDaysWithEntries,
  } = useDiaryStore();
  const profile = useAuthStore((state) => state.profile);
  const isOnline = useSyncStore((s) => s.isOnline);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entryDates = useMemo(() => getEntryDates(), [entries, getEntryDates]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daysWithEntries = useMemo(() => getDaysWithEntries(), [entries, getDaysWithEntries]);
  const discoveryUnlocked = profile?.discovery_unlocked ?? false;

  // Today's header label
  const todayDay = format(new Date(), 'EEEE');
  const todayDate = format(new Date(), 'MMMM d');

  // Streak = consecutive days with entries up to today
  const streakCount = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (entryDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [entryDates]);

  const [calendarExpanded, setCalendarExpanded] = React.useState(false);

  // Build sorted sections grouped by date, filtered when calendar is expanded
  const sections = useMemo<SectionData[]>(() => {
    const byDate = new Map<string, LocalDiaryEntry[]>();
    for (const entry of entries.values()) {
      if (calendarExpanded && entry.entry_date !== selectedDate) continue;
      const existing = byDate.get(entry.entry_date);
      if (existing) {
        existing.push(entry);
      } else {
        byDate.set(entry.entry_date, [entry]);
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({
        ...sectionTitleForDate(date),
        data: data.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      }));
  }, [entries, calendarExpanded, selectedDate]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    setIsRefreshing(false);
  }, []);

  const handlePressEntry = useCallback(
    (entry: LocalDiaryEntry) => {
      router.push(`/diary/${entry.entry_date}`);
    },
    [router],
  );

  const handleNewEntry = useCallback(() => {
    router.push('/diary/new');
  }, [router]);

  const handleToggleTheme = useCallback(() => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setMode(next);
  }, [isDark, setMode]);

  const renderItem = useCallback(
    ({ item }: { item: LocalDiaryEntry }) => (
      <DiaryEntryCard
        entry={item}
        onPress={() => handlePressEntry(item)}
        testID={`diary-card-${item.local_id}`}
      />
    ),
    [handlePressEntry],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        {/* Divider line */}
        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
        <View style={styles.sectionLabelRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            {section.title}
            <Text style={[styles.sectionDateLabel, { color: colors.textMuted }]}>
              {' - '}
              {section.dateLabel}
            </Text>
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            {section.data.length === 1
              ? '1 entry'
              : `${section.data.length} entries`}
          </Text>
        </View>
      </View>
    ),
    [colors],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
        <DiaryWeekStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          entryDates={entryDates}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          expanded={calendarExpanded}
          onExpandedChange={setCalendarExpanded}
          testID="diary-week-strip"
        />

        {/* Streak badge */}
        {streakCount > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.surface2 }]}>
            <Text style={styles.streakEmoji}>{'🔥'}</Text>
            <Text style={[styles.streakText, { color: colors.accent }]}>
              {streakCount} day streak
            </Text>
          </View>
        )}

        {!discoveryUnlocked && (
          <DiscoveryCountdown
            daysCompleted={daysWithEntries}
            totalDays={DISCOVERY_TOTAL_DAYS}
            testID="discovery-countdown"
          />
        )}
      </View>
    ),
    [
      selectedDate,
      entryDates,
      currentMonth,
      discoveryUnlocked,
      daysWithEntries,
      streakCount,
      calendarExpanded,
      setSelectedDate,
      setCurrentMonth,
      colors,
    ],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View
        style={{
          alignItems: 'center',
          padding: spacing['2xl'],
          gap: spacing.sm,
          marginTop: spacing.md,
        }}
        testID="diary-empty-state"
      >
        <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>{'📓'}</Text>
        <Text
          style={{
            ...typography.headingMd,
            fontFamily: fontFamily.semiBold,
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          Your story starts here
        </Text>
        <Text
          style={{
            ...typography.bodyMd,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Tap + to record your first founder diary entry. It only takes a minute.
        </Text>
        <Pressable
          onPress={handleNewEntry}
          style={{
            marginTop: spacing.md,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.full,
            backgroundColor: colors.accent,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="New diary entry"
          testID="empty-state-new-button"
        >
          <Text
            style={{
              ...typography.button,
              color: colors.accentText,
            }}
          >
            Write first entry
          </Text>
        </Pressable>
      </View>
    ),
    [colors, handleNewEntry],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
      testID="diary-index-screen"
    >
      {/* Fixed header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Diary
          </Text>
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            {todayDay}, {todayDate}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* Theme toggle pill */}
          <Pressable
            onPress={handleToggleTheme}
            style={[styles.themeToggle, { backgroundColor: colors.surface2 }]}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            testID="diary-theme-toggle"
          >
            <Text style={styles.themeToggleIcon}>
              {isDark ? '☀️' : '🌙'}
            </Text>
          </Pressable>
          {/* New entry button */}
          <Pressable
            onPress={handleNewEntry}
            style={({ pressed }) => [
              styles.headerAddBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="New diary entry"
            testID="diary-header-new-btn"
          >
            <Text style={[styles.headerAddBtnText, { color: colors.accentText }]}>
              {'＋'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Offline banner */}
      {!isOnline ? (
        <View
          style={[styles.offlineBanner, { backgroundColor: colors.surface2, borderBottomColor: colors.border }]}
          testID="offline-banner"
        >
          <Text style={[styles.offlineBannerText, { color: colors.textSecondary }]}>
            {'☁  Offline - entries saved locally'}
          </Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.local_id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.sm,
          paddingBottom: spacing['2xl'],
        }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        testID="diary-section-list"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  offlineBanner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  offlineBannerText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 18,
  },
  headerAddBtn: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtnText: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: fontFamily.regular,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    ...typography.label,
  },
  sectionHeader: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionDivider: {
    height: 1,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.label,
  },
  sectionDateLabel: {
    ...typography.label,
  },
  sectionCount: {
    ...typography.label,
  },
});
