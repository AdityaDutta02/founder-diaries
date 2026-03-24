import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GeneratedPost } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

interface PostActionBarProps {
  status: GeneratedPost['status'];
  onApprove: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
  onRegenerate: () => Promise<void> | void;
  isRegenerating?: boolean;
  testID?: string;
}

export const PostActionBar = memo(function PostActionBar({
  status,
  onApprove,
  onReject,
  onRegenerate,
  isRegenerating = false,
  testID,
}: PostActionBarProps) {
  const { colors } = useTheme();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const canApprove = status === 'draft' || status === 'rejected';
  const isRejected = status === 'rejected';
  const busy = isApproving || isRejecting || isRegenerating;

  const handleApprove = async () => {
    if (!canApprove || busy) return;
    setIsApproving(true);
    try { await onApprove(); } finally { setIsApproving(false); }
  };

  const handleReject = async () => {
    if (busy) return;
    setIsRejecting(true);
    try { await onReject(); } finally { setIsRejecting(false); }
  };

  return (
    <View
      style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
      testID={testID ?? 'post-action-bar'}
    >
      {/* Reject */}
      <Pressable
        onPress={() => void handleReject()}
        disabled={busy || isRejected}
        style={styles.rejectBtn}
        accessibilityRole="button"
        accessibilityLabel="Reject post"
        testID="btn-reject"
      >
        <Text
          style={[
            styles.rejectText,
            { color: busy || isRejected ? colors.textMuted : colors.textSecondary },
          ]}
        >
          Reject
        </Text>
      </Pressable>

      {/* Regenerate */}
      <Pressable
        onPress={() => void onRegenerate()}
        disabled={busy}
        style={[
          styles.regenBtn,
          {
            borderColor: busy ? colors.border : colors.borderStrong,
            backgroundColor: colors.surface2,
            opacity: busy ? 0.6 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Regenerate post"
        testID="btn-regenerate"
      >
        <Text style={[styles.regenIcon, { color: colors.textSecondary }]}>
          {isRegenerating ? '…' : '↻'}
        </Text>
        <Text style={[styles.regenText, { color: colors.textSecondary }]}>
          {isRegenerating ? 'Generating' : 'Regenerate'}
        </Text>
      </Pressable>

      {/* Approve */}
      <Pressable
        onPress={() => void handleApprove()}
        disabled={!canApprove || busy}
        style={[
          styles.approveBtn,
          {
            backgroundColor: canApprove && !busy ? colors.accent : colors.surface2,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Approve post"
        testID="btn-approve"
      >
        <Text
          style={[
            styles.approveBtnText,
            { color: canApprove && !busy ? colors.accentText : colors.textMuted },
          ]}
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  rejectBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
  },
  regenBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  regenIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  regenText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  approveBtn: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
