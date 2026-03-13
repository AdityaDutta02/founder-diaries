import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
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
}

const VARIANT_COLORS: Record<BadgeVariant, VariantColors> = {
  default: { background: colors.gray[100], text: colors.gray[700] },
  success: { background: '#D1FAE5', text: '#065F46' },
  warning: { background: '#FEF3C7', text: '#92400E' },
  error: { background: '#FEE2E2', text: '#991B1B' },
  info: { background: '#DBEAFE', text: '#1E40AF' },
  linkedin: { background: '#E8F1FA', text: colors.platform.linkedin },
  instagram: { background: '#FCE7EF', text: colors.platform.instagram },
  x: { background: colors.gray[100], text: colors.black },
};

export const Badge = memo(function Badge({
  label,
  variant = 'default',
  size = 'md',
  onRemove,
  testID,
}: BadgeProps) {
  const { background, text } = VARIANT_COLORS[variant];

  return (
    <View
      style={[
        styles.base,
        styles[`size_${size}`],
        { backgroundColor: background },
      ]}
      testID={testID ?? `badge-${label}`}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          styles[`labelSize_${size}`],
          { color: text },
        ]}
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
          style={styles.removeButton}
        >
          <Text style={[styles.removeText, { color: text }]}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  size_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    fontWeight: '500',
  },
  labelSize_sm: {
    fontSize: 10,
    lineHeight: 14,
  },
  labelSize_md: {
    fontSize: 12,
    lineHeight: 16,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 16,
    lineHeight: 18,
  },
});
