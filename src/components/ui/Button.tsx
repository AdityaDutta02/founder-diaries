import React, { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
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
  testID?: string;
}

const HEIGHT: Record<ButtonSize, number> = {
  sm: 32,
  md: 44,
  lg: 52,
};

const HORIZONTAL_PADDING: Record<ButtonSize, number> = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

function resolveIndicatorColor(variant: ButtonVariant): string {
  if (variant === 'primary' || variant === 'danger') return colors.white;
  if (variant === 'outline') return colors.primary[500];
  return colors.gray[700];
}

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
  testID,
  ...rest
}: ButtonProps) {
  const isSpinning = loading || isLoading;
  const isDisabled = disabled || isSpinning;
  const height = HEIGHT[size];
  const horizontalPadding = HORIZONTAL_PADDING[size];

  return (
    <Pressable
      testID={testID ?? `button-${label}`}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[`variant_${variant}`],
        { height, paddingHorizontal: horizontalPadding },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
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
          color={resolveIndicatorColor(variant)}
          testID="button-loading-indicator"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft} accessibilityElementsHidden>
              {icon}
            </View>
          )}
          <Text
            style={[
              styles.labelBase,
              styles[`labelText_${variant}`],
              styles[`labelSize_${size}`],
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight} accessibilityElementsHidden>
              {icon}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    minWidth: 44,
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  // Variant container styles
  variant_primary: {
    backgroundColor: colors.primary[500],
  },
  variant_secondary: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.error,
  },
  // Label base
  labelBase: {
    ...typography.button,
  },
  // Label variant text colors
  labelText_primary: {
    color: colors.white,
  },
  labelText_secondary: {
    color: colors.gray[700],
  },
  labelText_outline: {
    color: colors.primary[500],
  },
  labelText_ghost: {
    color: colors.gray[700],
  },
  labelText_danger: {
    color: colors.white,
  },
  // Label size overrides
  labelSize_sm: {
    fontSize: 14,
  },
  labelSize_md: {
    fontSize: 16,
  },
  labelSize_lg: {
    fontSize: 16,
  },
});
