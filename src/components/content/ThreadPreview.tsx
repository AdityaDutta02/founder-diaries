import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ThreadTweet } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

const TWEET_CHAR_LIMIT = 280;

interface ThreadPreviewProps {
  tweets: ThreadTweet[];
  testID?: string;
}

interface TweetItemProps {
  tweet: ThreadTweet;
  isLast: boolean;
}

function TweetItem({ tweet, isLast }: TweetItemProps) {
  const { colors } = useTheme();
  const charCount = tweet.text.length;
  const isOverLimit = charCount > TWEET_CHAR_LIMIT;

  return (
    <View style={styles.tweetRow} testID={`tweet-row-${tweet.order}`}>
      {/* Left side: order number + connecting line */}
      <View style={styles.leftColumn}>
        <View
          style={[styles.orderBadge, { backgroundColor: colors.surface2 }]}
        >
          <Text style={[styles.orderText, { color: colors.textPrimary }]}>
            {tweet.order}
          </Text>
        </View>
        {!isLast ? (
          <View style={[styles.connectingLine, { backgroundColor: colors.border }]} />
        ) : null}
      </View>

      {/* Tweet card */}
      <View
        style={[
          styles.tweetCard,
          {
            backgroundColor: colors.surface,
            borderColor: isOverLimit ? colors.error : colors.border,
          },
        ]}
        testID={`tweet-card-${tweet.order}`}
      >
        <View style={styles.tweetHeader}>
          <View />
          <Text
            style={[
              styles.charCount,
              {
                color: isOverLimit ? colors.error : colors.textMuted,
                fontFamily: isOverLimit ? fontFamily.semibold : fontFamily.regular,
              },
            ]}
            testID={`tweet-char-count-${tweet.order}`}
          >
            {charCount}/{TWEET_CHAR_LIMIT}
          </Text>
        </View>
        <Text
          style={[styles.tweetText, { color: colors.textPrimary }]}
          testID={`tweet-text-${tweet.order}`}
        >
          {tweet.text}
        </Text>
      </View>
    </View>
  );
}

export const ThreadPreview = memo(function ThreadPreview({
  tweets,
  testID,
}: ThreadPreviewProps) {
  const sorted = [...tweets].sort((a, b) => a.order - b.order);

  return (
    <ScrollView
      style={styles.container}
      testID={testID ?? 'thread-preview'}
      showsVerticalScrollIndicator={false}
    >
      {sorted.map((tweet, index) => (
        <TweetItem key={tweet.order} tweet={tweet} isLast={index === sorted.length - 1} />
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tweetRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  leftColumn: {
    alignItems: 'center',
    width: 28,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    ...typography.label,
    fontSize: 10,
  },
  connectingLine: {
    flex: 1,
    width: 2,
    marginTop: spacing.xs,
    minHeight: spacing.md,
  },
  tweetCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tweetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    ...typography.caption,
  },
  tweetText: {
    ...typography.bodyMd,
  },
});
