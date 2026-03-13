import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { DiaryCalendar } from '@/components/diary/DiaryCalendar';
import { DiaryEntryCard } from '@/components/diary/DiaryEntryCard';
import { DiscoveryCountdown } from '@/components/diary/DiscoveryCountdown';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius, shadows } from '@/theme/spacing';
import type { LocalDiaryEntry } from '@/stores/diaryStore';

const DISCOVERY_TOTAL_DAYS = 7;

interface SectionData {
  title: string;
  data: LocalDiaryEntry[];
}

function sectionTitleForDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export default function DiaryIndexScreen() {
  const router = useRouter();
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

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const entryDates = useMemo(() => getEntryDates(), [entries, getEntryDates]);
  const daysWithEntries = useMemo(() => getDaysWithEntries(), [entries, getDaysWithEntries]);
  const discoveryUnlocked = profile?.discovery_unlocked ?? false;

  // Build sorted sections grouped by date
  const sections = useMemo<SectionData[]>(() => {
    const byDate = new Map<string, LocalDiaryEntry[]>();
    for (const entry of entries.values()) {
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
        title: sectionTitleForDate(date),
        data: data.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      }));
  }, [entries]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Sync hook can be wired in here — for now just reset
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
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.listHeader}>
        <DiaryCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          entryDates={entryDates}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          testID="diary-calendar"
        />
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
      setSelectedDate,
      setCurrentMonth,
    ],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState} testID="diary-empty-state">
        <Text style={styles.emptyEmoji}>{'📓'}</Text>
        <Text style={styles.emptyTitle}>No entries yet</Text>
        <Text style={styles.emptyBody}>Tap + to record your first diary entry.</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container} testID="diary-index-screen">
      <HeaderBar title="My Diary" testID="diary-header" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.local_id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
        testID="diary-section-list"
      />
      {/* FAB */}
      <Pressable
        onPress={handleNewEntry}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        accessibilityRole="button"
        accessibilityLabel="New diary entry"
        testID="diary-fab"
      >
        <Text style={styles.fabIcon}>{'+'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['6xl'] + spacing.lg,
  },
  listHeader: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.headingSm,
    color: colors.gray[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    ...typography.headingMd,
    color: colors.gray[700],
  },
  emptyBody: {
    ...typography.bodyMd,
    color: colors.gray[500],
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing['3xl'],
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
    fontWeight: '400',
  },
});
