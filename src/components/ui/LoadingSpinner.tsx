import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
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
  color = colors.primary[500],
  testID,
}: LoadingSpinnerProps) {
  const dimension = SIZE_VALUES[size];

  return (
    <View
      style={styles.container}
      testID={testID ?? 'loading-spinner'}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <ActivityIndicator
        size={dimension}
        color={color}
        testID="activity-indicator"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
