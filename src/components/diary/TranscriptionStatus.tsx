import React, { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

type TranscriptionStatusValue = 'pending' | 'processing' | 'completed' | 'failed';

interface TranscriptionStatusProps {
  status: TranscriptionStatusValue;
  transcribedText?: string;
  onRetry?: () => void;
  testID?: string;
}

const STATUS_CONFIG: Record<
  TranscriptionStatusValue,
  { icon: string; label: string; color: string }
> = {
  pending: { icon: '🕐', label: 'Waiting to transcribe...', color: colors.gray[500] },
  processing: { icon: '', label: 'Transcribing...', color: colors.warning },
  completed: { icon: '✓', label: 'Transcribed', color: colors.success },
  failed: { icon: '✕', label: 'Transcription failed', color: colors.error },
};

export const TranscriptionStatus = memo(function TranscriptionStatus({
  status,
  transcribedText,
  onRetry,
  testID,
}: TranscriptionStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container} testID={testID ?? 'transcription-status'}>
      <View style={styles.row}>
        {status === 'processing' ? (
          <ActivityIndicator
            size="small"
            color={colors.warning}
            testID="transcription-spinner"
          />
        ) : (
          <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
        )}
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        {status === 'failed' && onRetry ? (
          <Pressable
            onPress={onRetry}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry transcription"
            testID="transcription-retry-button"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
      {status === 'completed' && transcribedText ? (
        <Text style={styles.transcribedText} testID="transcription-text">
          {transcribedText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    ...typography.bodySm,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  retryText: {
    ...typography.bodySm,
    color: colors.white,
    fontWeight: '600',
  },
  transcribedText: {
    ...typography.bodyMd,
    color: colors.gray[700],
    lineHeight: 20,
    paddingLeft: spacing.xl,
  },
});
