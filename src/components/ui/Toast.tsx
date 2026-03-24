import React, { memo, useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { useUIStore, type ToastVariant } from '@/stores/uiStore';

const SLIDE_DISTANCE = -80;
const ANIMATION_DURATION = 250;

interface ToastInnerProps {
  message: string;
  variant: ToastVariant;
  duration: number;
  onDismiss: () => void;
}

const ToastInner = memo(function ToastInner({
  message,
  variant,
  duration,
  onDismiss,
}: ToastInnerProps) {
  const { colors, shadows } = useTheme();
  const translateY = useSharedValue(SLIDE_DISTANCE);
  const opacity = useSharedValue(0);

  const accentColor: string = (() => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
    }
  })();

  useEffect(() => {
    translateY.value = withTiming(0, { duration: ANIMATION_DURATION });
    opacity.value = withSequence(
      withTiming(1, { duration: ANIMATION_DURATION }),
      withDelay(
        duration,
        withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        }),
      ),
    );

    return () => {
      translateY.value = SLIDE_DISTANCE;
      opacity.value = 0;
    };
  }, [message, variant, duration, onDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          borderRadius: borderRadius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          ...shadows.lg,
        },
        animatedStyle,
      ]}
      testID="toast-message"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={{
          ...typography.bodyMd,
          fontFamily: fontFamily.medium,
          color: colors.textPrimary,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
});

/**
 * Toast renders the global toast notification driven by uiStore.
 * Mount this once near the root of your app (inside SafeAreaProvider).
 */
export const Toast = memo(function Toast() {
  const { toast, hideToast } = useUIStore();
  const insets = useSafeAreaInsets();

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute' as const,
        left: spacing.lg,
        right: spacing.lg,
        zIndex: 9999,
        top: insets.top + spacing.sm,
      }}
      pointerEvents="none"
    >
      <ToastInner
        message={toast.message}
        variant={toast.variant}
        duration={toast.duration}
        onDismiss={hideToast}
      />
    </Animated.View>
  );
});

// Legacy context-based provider kept for backward compatibility.
// New code should use useUIStore().showToast() + mount <Toast /> at root.
export { ToastProvider, useToast } from './ToastProvider';
