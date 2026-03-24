import React, { memo } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent'
  | 'linkedin'
  | 'instagram'
  | 'x';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optional remove action (retained for backward compatibility) */
  onRemove?: () => void;
  testID?: string;
}

interface VariantColors {
  background: string;
  text: string;
  border: string;
}

export const Badge = memo(function Badge({
  label,
  variant = 'default',
  size = 'md',
  onRemove,
  testID,
}: BadgeProps) {
  const { colors } = useTheme();

  const variantColors: VariantColors = (() => {
    switch (variant) {
      case 'default':
        return {
          background: colors.surface2,
          text: colors.textSecondary,
          border: colors.border,
        };
      case 'success':
        return {
          background: colors.successLight,
          text: colors.success,
          border: 'transparent',
        };
      case 'warning':
        return {
          background: colors.warningLight,
          text: colors.warning,
          border: 'transparent',
        };
      case 'error':
        return {
          background: colors.errorLight,
          text: colors.error,
          border: 'transparent',
        };
      case 'info':
        return {
          background: colors.infoLight,
          text: colors.info,
          border: 'transparent',
        };
      case 'accent':
        return {
          background: colors.accentLight,
          text: colors.accent,
          border: 'transparent',
        };
      case 'linkedin':
        return {
          background: colors.infoLight,
          text: colors.platform.linkedin,
          border: 'transparent',
        };
      case 'instagram':
        return {
          background: colors.errorLight,
          text: colors.platform.instagram,
          border: 'transparent',
        };
      case 'x':
        return {
          background: colors.surface2,
          text: colors.textPrimary,
          border: colors.border,
        };
    }
  })();

  const isSm = size === 'sm';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: variantColors.border,
    backgroundColor: variantColors.background,
    alignSelf: 'flex-start',
    paddingVertical: isSm ? 2 : spacing.xs,
    paddingHorizontal: isSm ? spacing.sm : spacing.sm + 2,
    gap: spacing.xs,
  };

  return (
    <View
      style={containerStyle}
      testID={testID ?? `badge-${label}`}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={{
          ...typography.label,
          fontFamily: fontFamily.semibold,
          color: variantColors.text,
          fontSize: isSm ? 10 : 11,
          lineHeight: isSm ? 14 : 16,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          testID={`badge-remove-${label}`}
          style={{ justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 16, lineHeight: 18, color: variantColors.text }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
});
