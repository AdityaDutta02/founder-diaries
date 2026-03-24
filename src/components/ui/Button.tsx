import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** @deprecated Use loading instead */
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  /** Pill shape: uses borderRadius.full instead of borderRadius.md */
  pill?: boolean;
  testID?: string;
}

const HEIGHT: Record<ButtonSize, number> = {
  sm: 44,
  md: 44,
  lg: 52,
};

const HORIZONTAL_PADDING: Record<ButtonSize, number> = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

const FONT_SIZE: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 16,
};

export const Button = memo(function Button({
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  isLoading = false,
  disabled,
  icon,
  iconPosition = 'left',
  style,
  pill = false,
  testID,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isSpinning = loading || isLoading;
  const isDisabled = disabled || isSpinning;
  const height = HEIGHT[size];
  const horizontalPadding = HORIZONTAL_PADDING[size];
  const radius = pill ? borderRadius.full : borderRadius.md;

  const variantContainerStyle: ViewStyle = (() => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.accent };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.accent,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.accent,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.error };
    }
  })();

  const labelColor: string = (() => {
    switch (variant) {
      case 'primary':
        return colors.accentText;
      case 'secondary':
      case 'outline':
        return colors.accent;
      case 'ghost':
        return colors.textPrimary;
      case 'danger':
        return colors.white;
    }
  })();

  const indicatorColor: string = (() => {
    switch (variant) {
      case 'primary':
        return colors.accentText;
      case 'danger':
        return colors.white;
      case 'secondary':
      case 'outline':
        return colors.accent;
      case 'ghost':
        return colors.textPrimary;
    }
  })();

  return (
    <Pressable
      testID={testID ?? `button-${label}`}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderRadius: radius,
          flexDirection: 'row' as const,
          minWidth: 44,
          height,
          paddingHorizontal: horizontalPadding,
        },
        variantContainerStyle,
        fullWidth && { width: '100%' as const },
        pressed && !isDisabled && { opacity: 0.75 },
        isDisabled && { opacity: 0.45 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: isSpinning }}
      {...rest}
    >
      {isSpinning ? (
        <ActivityIndicator
          size="small"
          color={indicatorColor}
          testID="button-loading-indicator"
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: spacing.sm }} accessibilityElementsHidden>
              {icon}
            </View>
          )}
          <Text
            style={{
              ...typography.button,
              fontFamily: fontFamily.semibold,
              fontSize: FONT_SIZE[size],
              color: labelColor,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: spacing.sm }} accessibilityElementsHidden>
              {icon}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
});
