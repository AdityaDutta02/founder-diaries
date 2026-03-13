import React, { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { borderRadius } from '@/theme/spacing';

interface AudioRecordButtonProps {
  isRecording: boolean;
  onPress: () => void;
  testID?: string;
}

export const AudioRecordButton = memo(function AudioRecordButton({
  isRecording,
  onPress,
  testID,
}: AudioRecordButtonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      opacity.value = withRepeat(
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        style={[styles.button, isRecording ? styles.buttonRecording : styles.buttonDefault]}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
        accessibilityState={{ selected: isRecording }}
        testID={testID ?? 'audio-record-button'}
      >
        <Text style={[styles.icon, isRecording ? styles.iconRecording : styles.iconDefault]}>
          {'🎤'}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: colors.gray[100],
  },
  buttonRecording: {
    backgroundColor: colors.error,
  },
  icon: {
    fontSize: 24,
  },
  iconDefault: {
    // No tint modification needed for emoji
  },
  iconRecording: {
    // No tint modification needed for emoji
  },
});
