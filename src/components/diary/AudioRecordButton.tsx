import React, { memo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

interface AudioRecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  recordingDuration?: number;
  testID?: string;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const AudioRecordButton = memo(function AudioRecordButton({
  isRecording,
  onPress,
  recordingDuration = 0,
  testID,
}: AudioRecordButtonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      opacity.value = withRepeat(
        withTiming(0.5, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      scale.value = withRepeat(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', gap: spacing.sm }}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          style={{
            width: 72,
            height: 72,
            borderRadius: borderRadius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isRecording ? colors.error : colors.surface2,
            borderWidth: isRecording ? 0 : 1.5,
            borderColor: isRecording ? 'transparent' : colors.border,
          }}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          accessibilityState={{ selected: isRecording }}
          testID={testID ?? 'audio-record-button'}
        >
          <Text style={{ fontSize: 28 }}>{'🎤'}</Text>
        </Pressable>
      </Animated.View>

      {/* Timer */}
      {isRecording ? (
        <Text
          style={{
            ...typography.numericMd,
            color: colors.textPrimary,
          }}
          testID="recording-timer"
        >
          {formatDuration(recordingDuration)}
        </Text>
      ) : null}
    </View>
  );
});
