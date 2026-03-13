import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';

interface StepDotsProps {
  total: number;
  current: number;
  testID?: string;
}

export const StepDots = memo(function StepDots({ total, current, testID }: StepDotsProps) {
  return (
    <View style={styles.row} testID={testID ?? 'step-dots'} accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index === current ? styles.active : styles.inactive]}
          testID={`step-dot-${index}`}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  active: {
    backgroundColor: colors.primary[500],
    width: 20,
  },
  inactive: {
    backgroundColor: colors.gray[200],
  },
});
