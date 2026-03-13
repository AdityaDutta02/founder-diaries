import React, { memo, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { useUIStore, type ToastVariant } from '@/stores/uiStore';

const SLIDE_DISTANCE = -80;
const ANIMATION_DURATION = 250;

const TOAST_BG: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
  warning: colors.warning,
};

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
  const translateY = useSharedValue(SLIDE_DISTANCE);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Slide in
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
      style={[styles.toast, { backgroundColor: TOAST_BG[variant] }, animatedStyle]}
      testID="toast-message"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.toastText}>{message}</Text>
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
      style={[styles.container, { top: insets.top + spacing.sm }]}
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  toastText: {
    ...typography.bodyMd,
    color: colors.white,
    fontWeight: '500',
  },
});

// Legacy context-based provider kept for backward compatibility.
// New code should use useUIStore().showToast() + mount <Toast /> at root.
export { ToastProvider, useToast } from './ToastProvider';
