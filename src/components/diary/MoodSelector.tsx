import React, { memo } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface Mood {
  emoji: string;
  label: string;
  value: string;
}

const MOODS: Mood[] = [
  { emoji: '⚡', label: 'Energized', value: 'energized' },
  { emoji: '🎯', label: 'Productive', value: 'productive' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😰', label: 'Stressed', value: 'stressed' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
];

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (mood: string) => void;
  testID?: string;
}

export const MoodSelector = memo(function MoodSelector({
  selected,
  onSelect,
  testID,
}: MoodSelectorProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.sm,
      }}
      testID={testID ?? 'mood-selector'}
    >
      {MOODS.map((mood) => {
        const isSelected = selected === mood.value;
        return (
          <Pressable
            key={mood.value}
            onPress={() => onSelect(mood.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.full,
              backgroundColor: isSelected ? colors.accentLight : colors.surface2,
              borderWidth: 1,
              borderColor: isSelected ? colors.accent : colors.border,
            }}
            accessibilityRole="button"
            accessibilityLabel={`Select mood: ${mood.label}`}
            accessibilityState={{ selected: isSelected }}
            testID={`mood-option-${mood.value}`}
          >
            <Text style={{ fontSize: 16 }}>{mood.emoji}</Text>
            <Text
              style={{
                ...typography.label,
                color: isSelected ? colors.accent : colors.textSecondary,
              }}
            >
              {mood.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});
