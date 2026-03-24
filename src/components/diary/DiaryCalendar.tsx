import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
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
  const { colors } = useTheme();

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
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
      testID={testID ?? 'diary-calendar'}
    >
      {/* Month header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        }}
      >
        {/* "March 2026 ›" — tapping the › advances to next month */}
        <Pressable
          onPress={handleNextMonth}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}
          testID="calendar-month-label"
        >
          <Text
            style={{
              ...typography.headingLg,
              color: colors.textPrimary,
            }}
          >
            {monthLabel}
          </Text>
          <Text
            style={{
              fontSize: 18,
              lineHeight: 22,
              color: colors.accent,
              fontFamily: fontFamily.bold,
            }}
          >
            {'›'}
          </Text>
        </Pressable>

        {/* ‹ › navigation arrows */}
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Pressable
            onPress={handlePrevMonth}
            hitSlop={8}
            style={{ padding: spacing.xs }}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            testID="calendar-prev-month"
          >
            <Text
              style={{
                fontSize: 20,
                lineHeight: 24,
                color: colors.textMuted,
                fontFamily: fontFamily.bold,
              }}
            >
              {'‹'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleNextMonth}
            hitSlop={8}
            style={{ padding: spacing.xs }}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            testID="calendar-next-month"
          >
            <Text
              style={{
                fontSize: 20,
                lineHeight: 24,
                color: colors.textMuted,
                fontFamily: fontFamily.bold,
              }}
            >
              {'›'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Day-of-week labels */}
      <View style={{ flexDirection: 'row' }}>
        {DAY_LABELS.map((label, idx) => (
          <View
            key={`wl-${idx}`}
            style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}
          >
            <Text style={{ ...typography.label, color: colors.textMuted }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {gridCells.map((date, idx) => {
          if (date === null) {
            return (
              <View
                key={`blank-${idx}`}
                style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
              />
            );
          }
          const dateStr = format(date, 'yyyy-MM-dd');
          const isSelected = dateStr === selectedDate;
          const isTodayDate = isToday(date);
          const hasEntry = entryDates.has(dateStr);
          const isFuture = date > new Date();

          // Today: solid orange circle; selected (non-today): orange outline; others: transparent
          let circleBg: string | undefined;
          if (isTodayDate) {
            circleBg = colors.accent;
          } else if (isSelected) {
            circleBg = undefined;
          }

          const textColor = isTodayDate
            ? colors.accentText
            : isFuture
              ? colors.textMuted
              : colors.textSecondary;

          return (
            <Pressable
              key={dateStr}
              onPress={() => handleSelectDay(date)}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: borderRadius.full,
                ...(circleBg ? { backgroundColor: circleBg } : {}),
                ...(isSelected && !isTodayDate
                  ? {
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                      borderRadius: borderRadius.full,
                    }
                  : {}),
              }}
              accessibilityRole="button"
              accessibilityLabel={format(date, 'MMMM d, yyyy')}
              accessibilityState={{ selected: isSelected }}
              testID={`calendar-day-${dateStr}`}
            >
              <Text
                style={{
                  fontFamily: fontFamily.medium,
                  fontSize: 13,
                  lineHeight: 16,
                  color: textColor,
                  opacity: isFuture && !isTodayDate ? 0.4 : 1,
                }}
              >
                {format(date, 'd')}
              </Text>
              {/* Small orange dot below day number for days with entries */}
              {hasEntry && !isTodayDate ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 3,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.accent,
                  }}
                  testID={`entry-dot-${dateStr}`}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
