import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { borderRadius, shadows, spacing } from '@/theme/spacing';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
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
  variant = 'elevated',
  padding = 'lg',
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const paddingValue = PADDING_VALUES[padding];
  const cardStyle = [
    styles.base,
    styles[`variant_${variant}`],
    { padding: paddingValue },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
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
      style={cardStyle}
      testID={testID ?? 'card'}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  variant_elevated: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  variant_outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  variant_filled: {
    backgroundColor: colors.gray[50],
  },
  pressed: {
    opacity: 0.8,
  },
});
