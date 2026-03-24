import React, { memo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  /** Override the spinner color. Defaults to colors.accent. */
  color?: string;
  testID?: string;
}

const SIZE_VALUES: Record<SpinnerSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

export const LoadingSpinner = memo(function LoadingSpinner({
  size = 'md',
  color,
  testID,
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const dimension = SIZE_VALUES[size];
  const spinnerColor = color ?? colors.accent;

  return (
    <View
      style={{ alignItems: 'center', justifyContent: 'center' }}
      testID={testID ?? 'loading-spinner'}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator
        size={dimension}
        color={spinnerColor}
        testID="activity-indicator"
      />
    </View>
  );
});
