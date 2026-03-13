import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
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
  const showAction = actionLabel !== undefined && onAction !== undefined;

  return (
    <View
      style={styles.container}
      testID={testID ?? 'empty-state'}
      accessibilityRole="none"
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={styles.iconWrapper} accessibilityElementsHidden>
        {icon}
      </View>
      <Text style={styles.title} testID="empty-state-title">
        {title}
      </Text>
      <Text style={styles.description} testID="empty-state-description">
        {description}
      </Text>
      {showAction ? (
        <View style={styles.actionWrapper}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headingMd,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodyMd,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  actionWrapper: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
