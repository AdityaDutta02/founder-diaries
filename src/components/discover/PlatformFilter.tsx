import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export type DiscoverPlatformFilter = 'all' | 'linkedin' | 'x';

interface FilterOption {
  value: DiscoverPlatformFilter;
  label: string;
}

const OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X' },
];

interface PlatformFilterProps {
  selected: DiscoverPlatformFilter;
  onSelect: (value: DiscoverPlatformFilter) => void;
  testID?: string;
}

export const PlatformFilter = memo(function PlatformFilter({
  selected,
  onSelect,
  testID,
}: PlatformFilterProps) {
  const { colors } = useTheme();

  return (
    <View testID={testID ?? 'platform-filter'}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.pill,
                isSelected
                  ? { backgroundColor: colors.accent, borderColor: colors.accent }
                  : {
                      backgroundColor: colors.surface2,
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
              ]}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter by ${option.label}`}
              testID={`platform-filter-${option.value}`}
            >
              <Text
                style={[
                  styles.pillLabel,
                  {
                    color: isSelected ? colors.accentText : colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  pillLabel: {
    ...typography.label,
  },
});
