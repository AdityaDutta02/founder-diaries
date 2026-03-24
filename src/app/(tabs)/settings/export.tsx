import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAuthStore } from '@/stores/authStore';
import { exportDiaryAsPDF, exportDiaryAsText } from '@/services/exportService';
import type { ExportOptions } from '@/services/exportService';
import { logger } from '@/lib/logger';

type ExportFormat = 'pdf' | 'text';

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isoFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface FormatCardProps {
  format: ExportFormat;
  selected: boolean;
  label: string;
  description: string;
  onPress: () => void;
}

function FormatCard({ format, selected, label, description, onPress }: FormatCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[
        styles.formatCard,
        {
          backgroundColor: selected ? colors.accentLight : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: borderRadius.lg,
        },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={`format-card-${format}`}
    >
      <View style={styles.formatCardHeader}>
        <View
          style={[
            styles.formatRadio,
            {
              borderColor: selected ? colors.accent : colors.textMuted,
            },
          ]}
        >
          {selected && (
            <View style={[styles.formatRadioDot, { backgroundColor: colors.accent }]} />
          )}
        </View>
        <Text
          style={[
            typography.headingSm,
            { color: selected ? colors.accent : colors.textPrimary },
          ]}
        >
          {label}
        </Text>
      </View>
      <Text style={[typography.bodyMd, { color: colors.textSecondary, lineHeight: 20 }]}>
        {description}
      </Text>
    </Pressable>
  );
}

export default function ExportScreen() {
  const { colors } = useTheme();
  const { show: showToast } = useToast();
  const entriesMap = useDiaryStore((s) => s.entries);
  const profile = useAuthStore((s) => s.profile);

  const [allEntries, setAllEntries] = useState(true);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState(new Date());
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  // Count entries matching the current filter
  const filteredCount = useMemo(() => {
    const allArr = Array.from(entriesMap.values());
    if (allEntries) return allArr.length;
    const from = isoFromDate(fromDate);
    const to = isoFromDate(toDate);
    return allArr.filter((e) => e.entry_date >= from && e.entry_date <= to).length;
  }, [entriesMap, allEntries, fromDate, toDate]);

  // Cycle date by ±1 day — simple pressable-based picker
  const adjustDate = useCallback(
    (which: 'from' | 'to', direction: 1 | -1) => {
      const setter = which === 'from' ? setFromDate : setToDate;
      setter((prev) => {
        const next = new Date(prev);
        next.setDate(next.getDate() + direction);
        return next;
      });
    },
    [],
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const allArr = Array.from(entriesMap.values());
      const options: ExportOptions = {
        authorName: profile?.full_name ?? profile?.email ?? undefined,
        dateFrom: allEntries ? undefined : fromDate,
        dateTo: allEntries ? undefined : toDate,
      };

      if (format === 'pdf') {
        await exportDiaryAsPDF(allArr, options);
      } else {
        await exportDiaryAsText(allArr, options);
      }
    } catch (err) {
      logger.error('Export failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  }, [entriesMap, profile, allEntries, fromDate, toDate, format, showToast]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="export-screen"
    >
      <HeaderBar title="Export Diary" showBack />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Range Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            Date Range
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
              <Text style={[typography.bodyLg, { color: colors.textPrimary }]}>
                All entries
              </Text>
              <Switch
                value={allEntries}
                onValueChange={setAllEntries}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
                testID="all-entries-toggle"
              />
            </View>

            {!allEntries && (
              <View style={styles.dateRangeContainer} testID="date-range-picker">
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <DateAdjuster
                  label="From"
                  date={fromDate}
                  onDecrement={() => adjustDate('from', -1)}
                  onIncrement={() => adjustDate('from', 1)}
                  testID="from-date"
                />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <DateAdjuster
                  label="To"
                  date={toDate}
                  onDecrement={() => adjustDate('to', -1)}
                  onIncrement={() => adjustDate('to', 1)}
                  testID="to-date"
                />
              </View>
            )}
          </View>
        </View>

        {/* Format Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            Format
          </Text>
          <View style={styles.formatCards}>
            <FormatCard
              format="pdf"
              selected={format === 'pdf'}
              label="PDF Document"
              description="A polished, beautifully formatted document — great for saving or sharing."
              onPress={() => setFormat('pdf')}
            />
            <FormatCard
              format="text"
              selected={format === 'text'}
              label="Plain Text"
              description="A simple .txt file — readable anywhere, no formatting."
              onPress={() => setFormat('text')}
            />
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.label,
              { color: colors.textMuted, paddingHorizontal: spacing.xs },
            ]}
          >
            Preview
          </Text>
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            <Text
              style={[typography.headingSm, { color: colors.textPrimary }]}
              testID="export-entry-count"
            >
              {filteredCount} {filteredCount === 1 ? 'entry' : 'entries'} will be exported
            </Text>
            {filteredCount === 0 && (
              <Text style={[typography.bodySm, { color: colors.textMuted }]}>
                No entries match the selected date range.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Export button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          label={isExporting ? 'Exporting…' : 'Export & Share'}
          variant="primary"
          fullWidth
          loading={isExporting}
          disabled={filteredCount === 0}
          onPress={handleExport}
          testID="export-button"
        />
      </View>
    </SafeAreaView>
  );
}

interface DateAdjusterProps {
  label: string;
  date: Date;
  onDecrement: () => void;
  onIncrement: () => void;
  testID?: string;
}

function DateAdjuster({ label, date, onDecrement, onIncrement, testID }: DateAdjusterProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.dateRow} testID={testID}>
      <Text
        style={[
          typography.bodyMd,
          { color: colors.textSecondary, fontFamily: fontFamily.medium },
        ]}
      >
        {label}
      </Text>
      <View style={styles.dateControls}>
        <Pressable
          style={[
            styles.dateArrow,
            { backgroundColor: colors.surface2, borderRadius: borderRadius.sm },
          ]}
          onPress={onDecrement}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label} date`}
          testID={`${testID}-decrement`}
        >
          <Text style={[styles.dateArrowText, { color: colors.textSecondary }]}>‹</Text>
        </Pressable>
        <Text
          style={[
            typography.bodyMd,
            { color: colors.textPrimary, fontFamily: fontFamily.medium, minWidth: 120, textAlign: 'center' },
          ]}
          testID={`${testID}-value`}
        >
          {formatDateForDisplay(date)}
        </Text>
        <Pressable
          style={[
            styles.dateArrow,
            { backgroundColor: colors.surface2, borderRadius: borderRadius.sm },
          ]}
          onPress={onIncrement}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label} date`}
          testID={`${testID}-increment`}
        >
          <Text style={[styles.dateArrowText, { color: colors.textSecondary }]}>›</Text>
        </Pressable>
      </View>
    </View>
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
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dateRangeContainer: {
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: 18,
    lineHeight: 22,
  },
  formatCards: {
    gap: spacing.sm,
  },
  formatCard: {
    padding: spacing.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  formatCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  formatRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewCard: {
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
