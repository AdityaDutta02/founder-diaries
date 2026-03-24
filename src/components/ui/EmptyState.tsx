import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const showAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: spacing['4xl'],
        paddingHorizontal: spacing['2xl'],
        alignSelf: 'stretch',
      }}
      testID={testID ?? 'empty-state'}
      accessibilityRole="none"
      accessibilityLabel={`${title}. ${description}`}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
        }}
        accessibilityElementsHidden
      >
        {icon}
      </View>
      <Text
        style={{
          ...typography.headingMd,
          fontFamily: fontFamily.semibold,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
        testID="empty-state-title"
      >
        {title}
      </Text>
      <Text
        style={{
          ...typography.bodyMd,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        }}
        testID="empty-state-description"
      >
        {description}
      </Text>
      {showAction ? (
        <View style={{ marginTop: spacing.xl, minWidth: 160 }}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
            testID="empty-state-action"
          />
        </View>
      ) : null}
    </View>
  );
});
