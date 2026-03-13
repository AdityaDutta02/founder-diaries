import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Returns 0=Monday, 6=Sunday offset for a day (getDay returns 0=Sunday)
function getMondayIndex(date: Date): number {
  const day = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 6 : day - 1;
}

interface DiaryCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  entryDates: Set<string>;
  currentMonth: Date;
  onChangeMonth: (newMonth: Date) => void;
  testID?: string;
}

export const DiaryCalendar = memo(function DiaryCalendar({
  selectedDate,
  onSelectDate,
  entryDates,
  currentMonth,
  onChangeMonth,
  testID,
}: DiaryCalendarProps) {
  const monthLabel = format(currentMonth, 'MMMM yyyy');

  const { days, leadingBlanks } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const allDays = eachDayOfInterval({ start, end });
    const blanks = getMondayIndex(start);
    return { days: allDays, leadingBlanks: blanks };
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    onChangeMonth(subMonths(currentMonth, 1));
  }, [currentMonth, onChangeMonth]);

  const handleNextMonth = useCallback(() => {
    onChangeMonth(addMonths(currentMonth, 1));
  }, [currentMonth, onChangeMonth]);

  const handleSelectDay = useCallback(
    (date: Date) => {
      onSelectDate(format(date, 'yyyy-MM-dd'));
    },
    [onSelectDate],
  );

  // Build grid cells: blanks + days
  const gridCells: (Date | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...days,
  ];

  return (
    <View style={styles.container} testID={testID ?? 'diary-calendar'}>
      {/* Month header */}
      <View style={styles.header}>
        <Pressable
          onPress={handlePrevMonth}
          hitSlop={8}
          style={styles.arrowButton}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          testID="calendar-prev-month"
        >
          <Text style={styles.arrow}>{'‹'}</Text>
        </Pressable>
        <Text style={styles.monthLabel} testID="calendar-month-label">
          {monthLabel}
        </Text>
        <Pressable
          onPress={handleNextMonth}
          hitSlop={8}
          style={styles.arrowButton}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          testID="calendar-next-month"
        >
          <Text style={styles.arrow}>{'›'}</Text>
        </Pressable>
      </View>

      {/* Day-of-week labels */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, idx) => (
          <View key={`wl-${idx}`} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {gridCells.map((date, idx) => {
          if (date === null) {
            return <View key={`blank-${idx}`} style={styles.dayCell} />;
          }
          const dateStr = format(date, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isTodayDate = isToday(date);
          const hasEntry = entryDates.has(dateStr);

          return (
            <Pressable
              key={dateStr}
              onPress={() => handleSelectDay(date)}
              style={[
                styles.dayCell,
                isTodayDate && !isSelected && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={format(date, 'MMMM d, yyyy')}
              accessibilityState={{ selected: isSelected }}
              testID={`calendar-day-${dateStr}`}
            >
              <Text
                style={[
                  styles.dayText,
                  isTodayDate && !isSelected && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {format(date, 'd')}
              </Text>
              {hasEntry && (
                <View
                  style={[styles.entryDot, isSelected && styles.entryDotSelected]}
                  testID={`calendar-entry-dot-${dateStr}`}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  arrowButton: {
    padding: spacing.xs,
  },
  arrow: {
    fontSize: 22,
    color: colors.gray[700],
    fontWeight: '600',
  },
  monthLabel: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekLabel: {
    ...typography.label,
    color: colors.gray[400],
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    gap: 2,
  },
  dayCellToday: {
    backgroundColor: colors.primary[100],
  },
  dayCellSelected: {
    backgroundColor: colors.primary[500],
  },
  dayText: {
    ...typography.bodyMd,
    color: colors.gray[700],
    fontWeight: '500',
  },
  dayTextToday: {
    color: colors.primary[600],
    fontWeight: '700',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
  entryDotSelected: {
    backgroundColor: colors.white,
  },
});
