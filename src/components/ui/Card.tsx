import React, { memo } from 'react';
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'accent' | 'filled';
export type CardPadding = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const PADDING_VALUES: Record<CardPadding, number> = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

export const Card = memo(function Card({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const { colors, shadows } = useTheme();
  const paddingValue = PADDING_VALUES[padding];

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.borderStrong,
        };
      case 'ghost':
        return {
          backgroundColor: colors.surface2,
        };
      case 'accent':
        return {
          backgroundColor: colors.accentLight,
          borderWidth: 1,
          borderColor: colors.accent + '4D', // ~30% opacity
        };
      // Backward compat: 'filled' maps to ghost behavior
      case 'filled':
        return {
          backgroundColor: colors.surface2,
        };
    }
  })();

  const baseStyle: ViewStyle = {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: paddingValue,
  };

  const composedStyle = [baseStyle, variantStyle, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...composedStyle,
          pressed && { opacity: 0.8 },
        ]}
        testID={testID ?? 'card'}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={composedStyle}
      testID={testID ?? 'card'}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
});
