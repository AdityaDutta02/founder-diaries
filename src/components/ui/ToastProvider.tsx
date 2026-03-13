/**
 * Legacy context-based toast provider.
 * Prefer using useUIStore().showToast() with the <Toast /> component instead.
 */
import React, { createContext, memo, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';

type LegacyToastType = 'success' | 'error' | 'info' | 'warning';

interface LegacyToastMessage {
  id: number;
  message: string;
  type: LegacyToastType;
}

interface ToastContextValue {
  show: (message: string, type?: LegacyToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const LEGACY_TOAST_DURATION = 3000;

const LEGACY_BG: Record<LegacyToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
  warning: colors.warning,
};

const SingleToast = memo(function SingleToast({
  message,
  type,
}: Omit<LegacyToastMessage, 'id'>) {
  return (
    <View
      style={[styles.toast, { backgroundColor: LEGACY_BG[type] }]}
      testID="toast-message"
      accessibilityRole="alert"
    >
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<LegacyToastMessage[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: LegacyToastType = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, LEGACY_TOAST_DURATION);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((toast) => (
          <SingleToast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
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
