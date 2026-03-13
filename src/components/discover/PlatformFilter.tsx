import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export type DiscoverPlatformFilter = 'all' | 'linkedin' | 'instagram' | 'x';

interface FilterOption {
  value: DiscoverPlatformFilter;
  label: string;
}

const OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
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
                isSelected && styles.pillSelected,
                pressed && !isSelected && styles.pillPressed,
              ]}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Filter by ${option.label}`}
              testID={`platform-filter-${option.value}`}
            >
              <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
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
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  pillSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillLabel: {
    ...typography.bodySm,
    color: colors.gray[500],
    fontWeight: '500',
  },
  pillLabelSelected: {
    color: colors.white,
    fontWeight: '600',
  },
});
