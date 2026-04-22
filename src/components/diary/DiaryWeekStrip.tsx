import React, { memo, useState, useCallback } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { addDays, addWeeks, format, isToday, startOfWeek } from 'date-fns';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { DiaryCalendar } from './DiaryCalendar';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DiaryWeekStripProps {
  selectedDate: string; // 'yyyy-MM-dd'
  onSelectDate: (date: string) => void;
  entryDates: Set<string>;
  currentMonth: Date;
  onChangeMonth: (month: Date) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  testID?: string;
}

export const DiaryWeekStrip = memo(function DiaryWeekStrip({
  selectedDate,
  onSelectDate,
  entryDates,
  currentMonth,
  onChangeMonth,
  expanded,
  onExpandedChange,
  testID,
}: DiaryWeekStripProps) {
  const { colors } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  // Monday-start week (consistent with DiaryCalendar)
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPrevWeek = useCallback(() => {
    const newStart = startOfWeek(addWeeks(today, weekOffset - 1), { weekStartsOn: 1 });
    setWeekOffset((o) => o - 1);
    onChangeMonth(newStart);
  }, [weekOffset, today, onChangeMonth]);

  const goToNextWeek = useCallback(() => {
    const newStart = startOfWeek(addWeeks(today, weekOffset + 1), { weekStartsOn: 1 });
    setWeekOffset((o) => o + 1);
    onChangeMonth(newStart);
  }, [weekOffset, today, onChangeMonth]);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandedChange(!expanded);
  }, [expanded, onExpandedChange]);

  const handleShowAll = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelectDate(format(new Date(), 'yyyy-MM-dd'));
    onExpandedChange(false);
  }, [onSelectDate, onExpandedChange]);

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(30)
    .onEnd((event) => {
      if (Math.abs(event.translationY) > 40) return; // ignore vertical swipes
      if (event.translationX > 50) {
        goToPrevWeek();
      } else if (event.translationX < -50) {
        goToNextWeek();
      }
    });

  const monthLabel = format(weekStart, 'MMMM yyyy');

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
      testID={testID ?? 'diary-week-strip'}
    >
      {/* Header: month label + expand chevron + week nav arrows (hidden when expanded — calendar has its own) */}
      {!expanded && (
        <View style={styles.header}>
          <Pressable
            onPress={toggleExpanded}
            style={styles.monthBtn}
            accessibilityRole="button"
            accessibilityLabel="Expand to month view"
            hitSlop={8}
            testID="week-strip-month-label"
          >
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {monthLabel}
            </Text>
            <Text style={[styles.expandChevron, { color: colors.textMuted }]}>
              {' ▼'}
            </Text>
          </Pressable>

          <View style={styles.navRow}>
            <Pressable
              onPress={goToPrevWeek}
              style={styles.navBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Previous week"
              testID="week-strip-prev"
            >
              <Text style={[styles.navArrow, { color: colors.textMuted }]}>{'‹'}</Text>
            </Pressable>
            <Pressable
              onPress={goToNextWeek}
              style={styles.navBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Next week"
              testID="week-strip-next"
            >
              <Text style={[styles.navArrow, { color: colors.textMuted }]}>{'›'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Week strip (swipeable) or expanded month calendar */}
      {expanded ? (
        <>
          <DiaryCalendar
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            entryDates={entryDates}
            currentMonth={currentMonth}
            onChangeMonth={onChangeMonth}
          />
          <Pressable
            onPress={handleShowAll}
            style={[styles.showAllBtn, { backgroundColor: colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Show all entries"
            hitSlop={8}
            testID="calendar-show-all-btn"
          >
            <Text style={[styles.showAllText, { color: colors.accentText }]}>Show All</Text>
          </Pressable>
        </>
      ) : (
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.weekRow} testID="week-strip-row">
            {days.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasEntry = entryDates.has(dateStr);
              const isSelected = dateStr === selectedDate;
              const todayFlag = isToday(day);
              const isFuture = day > today;

              const textColor = todayFlag
                ? colors.accentText
                : isSelected
                  ? colors.accent
                  : isFuture
                    ? colors.textMuted
                    : colors.textSecondary;

              return (
                <Pressable
                  key={dateStr}
                  onPress={() => onSelectDate(dateStr)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={format(day, 'EEEE, MMMM d')}
                  accessibilityState={{ selected: isSelected }}
                  testID={`week-day-${dateStr}`}
                >
                  {/* Day letter (M/T/W/T/F/S/S) */}
                  <Text
                    style={[
                      styles.dayLetter,
                      {
                        color:
                          todayFlag || isSelected ? colors.accent : colors.textMuted,
                      },
                    ]}
                  >
                    {DAY_LETTERS[index]}
                  </Text>

                  {/* Day number — with circle for today or selected */}
                  <View
                    style={[
                      styles.dayCircle,
                      todayFlag && { backgroundColor: colors.accent },
                      isSelected &&
                        !todayFlag && {
                          borderWidth: 1.5,
                          borderColor: colors.accent,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: textColor },
                        isFuture && !todayFlag && { opacity: 0.4 },
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>

                  {/* Entry dot (below circle) — no space reserved when empty */}
                  {hasEntry ? (
                    <View
                      style={[styles.entryDot, { backgroundColor: colors.accent, marginTop: 2 }]}
                      testID={`week-entry-dot-${dateStr}`}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </GestureDetector>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  monthLabel: {
    ...typography.headingSm,
  },
  expandChevron: {
    fontSize: 10,
    lineHeight: 14,
  },
  showAllBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
  showAllText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: fontFamily.bold,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    minHeight: 44,
    gap: 2,
    paddingVertical: spacing.xs,
  },
  dayLetter: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  dotSlot: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
