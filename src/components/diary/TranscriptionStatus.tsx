import React, { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

type TranscriptionStatusValue = 'pending' | 'processing' | 'completed' | 'failed';

interface TranscriptionStatusProps {
  status: TranscriptionStatusValue;
  transcribedText?: string;
  onRetry?: () => void;
  testID?: string;
}

export const TranscriptionStatus = memo(function TranscriptionStatus({
  status,
  transcribedText,
  onRetry,
  testID,
}: TranscriptionStatusProps) {
  const { colors } = useTheme();

  const statusConfig: Record<
    TranscriptionStatusValue,
    { icon: string; label: string; color: string }
  > = {
    pending: { icon: '🕐', label: 'Waiting to transcribe...', color: colors.textMuted },
    processing: { icon: '', label: 'Transcribing...', color: colors.warning },
    completed: { icon: '✓', label: 'Transcribed', color: colors.success },
    failed: { icon: '✕', label: 'Transcription failed', color: colors.error },
  };

  const config = statusConfig[status];

  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        gap: spacing.sm,
      }}
      testID={testID ?? 'transcription-status'}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {status === 'processing' ? (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            testID="transcription-spinner"
          />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: '600', color: config.color }}>
            {config.icon}
          </Text>
        )}
        <Text
          style={{
            ...typography.bodySm,
            color: colors.textSecondary,
            fontWeight: '500',
            flex: 1,
          }}
        >
          {config.label}
        </Text>
        {status === 'failed' && onRetry ? (
          <Pressable
            onPress={onRetry}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              backgroundColor: colors.error,
              borderRadius: borderRadius.sm,
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry transcription"
            testID="transcription-retry-button"
          >
            <Text
              style={{
                ...typography.bodySm,
                color: colors.white,
                fontWeight: '600',
              }}
            >
              Retry
            </Text>
          </Pressable>
        ) : null}
      </View>
      {status === 'completed' && transcribedText ? (
        <Text
          style={{
            ...typography.bodyMd,
            color: colors.textSecondary,
            lineHeight: 20,
            paddingLeft: spacing.xl,
          }}
          testID="transcription-text"
        >
          {transcribedText}
        </Text>
      ) : null}
    </View>
  );
});
