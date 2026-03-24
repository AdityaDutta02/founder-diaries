import React, { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export interface ProgressBarProps {
  /** Value between 0 and 1 */
  progress: number;
  /** Override the fill color. Defaults to colors.accent. */
  color?: string;
  height?: number;
  label?: string;
  testID?: string;
}

const ANIMATION_DURATION = 300;

export const ProgressBar = memo(function ProgressBar({
  progress,
  color,
  height = 8,
  label,
  testID,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color ?? colors.accent;
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <Text
            style={{
              ...typography.label,
              fontFamily: fontFamily.semibold,
              color: colors.textSecondary,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              ...typography.label,
              fontFamily: fontFamily.semibold,
              color: colors.textMuted,
            }}
          >
            {accessibilityValue}%
          </Text>
        </View>
      ) : null}
      <View
        style={{
          width: '100%',
          height,
          borderRadius: borderRadius.full,
          backgroundColor: colors.surface2,
          overflow: 'hidden',
        }}
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? 'Progress'}
        accessibilityValue={{ min: 0, max: 100, now: accessibilityValue }}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              height,
              borderRadius: borderRadius.full,
              backgroundColor: fillColor,
            },
            animatedFillStyle,
          ]}
          testID="progress-bar-fill"
        />
      </View>
    </View>
  );
});
