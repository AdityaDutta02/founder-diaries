import React, { memo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';

interface StepDotsProps {
  total: number;
  current: number;
  testID?: string;
}

export const StepDots = memo(function StepDots({ total, current, testID }: StepDotsProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' }}
      testID={testID ?? 'step-dots'}
      accessibilityLabel={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: borderRadius.full,
            },
            index === current
              ? { backgroundColor: colors.accent, width: 20 }
              : { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
          ]}
          accessibilityLabel={`Step ${index + 1}${index === current ? ', current' : ''}`}
          testID={`step-dot-${index}`}
        />
      ))}
    </View>
  );
});
