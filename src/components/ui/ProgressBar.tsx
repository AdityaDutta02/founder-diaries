import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export interface ProgressBarProps {
  /** Value between 0 and 1 */
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  testID?: string;
}

const ANIMATION_DURATION = 300;

export const ProgressBar = memo(function ProgressBar({
  progress,
  color = colors.primary[500],
  height = 8,
  label,
  testID,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const widthPercent = useSharedValue(clampedProgress * 100);

  useEffect(() => {
    widthPercent.value = withTiming(clampedProgress * 100, {
      duration: ANIMATION_DURATION,
    });
  }, [clampedProgress, widthPercent]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${widthPercent.value}%`,
  }));

  const accessibilityValue = Math.round(clampedProgress * 100);

  return (
    <View testID={testID ?? 'progress-bar'}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.percentText}>{accessibilityValue}%</Text>
        </View>
      ) : null}
      <View
        style={[styles.track, { height, borderRadius: height / 2 }]}
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? 'Progress'}
        accessibilityValue={{ min: 0, max: 100, now: accessibilityValue }}
      >
        <Animated.View
          style={[
            styles.fill,
            animatedFillStyle,
            { height, borderRadius: height / 2, backgroundColor: color },
          ]}
          testID="progress-bar-fill"
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.gray[700],
  },
  percentText: {
    ...typography.label,
    color: colors.gray[500],
  },
  track: {
    width: '100%',
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
    borderRadius: borderRadius.full,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
