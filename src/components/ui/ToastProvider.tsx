/**
 * Legacy context-based toast provider.
 * Prefer using useUIStore().showToast() with the <Toast /> component instead.
 */
import React, { createContext, memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

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

const SingleToast = memo(function SingleToast({
  message,
  type,
}: Omit<LegacyToastMessage, 'id'>) {
  const { colors, shadows } = useTheme();

  const accentColor: string = (() => {
    switch (type) {
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

  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        ...shadows.lg,
      }}
      testID="toast-message"
      accessibilityRole="alert"
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
    </View>
  );
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<LegacyToastMessage[]>([]);
  const counter = useRef(0);
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((t) => clearTimeout(t));
      timeoutRefs.current.clear();
    };
  }, []);

  const show = useCallback((message: string, type: LegacyToastType = 'info') => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      timeoutRefs.current.delete(id);
    }, LEGACY_TOAST_DURATION);
    timeoutRefs.current.set(id, timeoutId);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View
        style={{
          position: 'absolute' as const,
          top: 60,
          left: spacing.lg,
          right: spacing.lg,
          gap: spacing.sm,
          zIndex: 9999,
        }}
        pointerEvents="none"
      >
        {toasts.map((toast) => (
          <SingleToast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}
