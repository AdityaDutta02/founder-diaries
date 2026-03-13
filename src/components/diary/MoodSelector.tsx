import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      testID={testID ?? 'mood-selector'}
    >
      {MOODS.map((mood) => {
        const isSelected = selected === mood.value;
        return (
          <Pressable
            key={mood.value}
            onPress={() => onSelect(mood.value)}
            style={[styles.moodItem, isSelected && styles.moodItemSelected]}
            accessibilityRole="button"
            accessibilityLabel={`Select mood: ${mood.label}`}
            accessibilityState={{ selected: isSelected }}
            testID={`mood-option-${mood.value}`}
          >
            <View
              style={[styles.emojiCircle, isSelected && styles.emojiCircleSelected]}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {mood.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  moodItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  moodItemSelected: {},
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiCircleSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    ...typography.label,
    color: colors.gray[500],
  },
  labelSelected: {
    color: colors.primary[500],
  },
});
