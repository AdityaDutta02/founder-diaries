import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { GeneratedPost } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { shadows, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';

interface PostActionBarProps {
  status: GeneratedPost['status'];
  onApprove: () => Promise<void> | void;
  onEdit: () => void;
  onReject: () => Promise<void> | void;
  onRegenerate?: () => Promise<void> | void;
  testID?: string;
}

export const PostActionBar = memo(function PostActionBar({
  status,
  onApprove,
  onEdit,
  onReject,
  testID,
}: PostActionBarProps) {
  const [approvingLoading, setApprovingLoading] = useState(false);
  const [rejectingLoading, setRejectingLoading] = useState(false);

  const canApprove = status === 'draft' || status === 'rejected';

  const handleApprove = async () => {
    setApprovingLoading(true);
    try {
      await onApprove();
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectingLoading(true);
    try {
      await onReject();
    } finally {
      setRejectingLoading(false);
    }
  };

  return (
    <View style={styles.bar} testID={testID ?? 'post-action-bar'}>
      <Button
        label="Reject"
        variant="ghost"
        size="md"
        onPress={handleReject}
        isLoading={rejectingLoading}
        disabled={approvingLoading || status === 'rejected'}
        style={styles.rejectButton}
        testID="btn-reject"
      />
      <Button
        label="Edit"
        variant="outline"
        size="md"
        onPress={onEdit}
        disabled={approvingLoading || rejectingLoading}
        testID="btn-edit"
      />
      {canApprove ? (
        <Button
          label="Approve"
          variant="primary"
          size="md"
          onPress={handleApprove}
          isLoading={approvingLoading}
          disabled={rejectingLoading}
          testID="btn-approve"
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    ...shadows.sm,
  },
  rejectButton: {
    flex: 1,
  },
});
