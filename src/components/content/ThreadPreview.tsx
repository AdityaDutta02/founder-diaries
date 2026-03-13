import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ThreadTweet } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
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
  const charCount = tweet.text.length;
  const isOverLimit = charCount > TWEET_CHAR_LIMIT;

  return (
    <View style={styles.tweetRow} testID={`tweet-row-${tweet.order}`}>
      {/* Left side: order number + connecting line */}
      <View style={styles.leftColumn}>
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{tweet.order}</Text>
        </View>
        {!isLast ? <View style={styles.connectingLine} /> : null}
      </View>

      {/* Tweet card */}
      <View
        style={[styles.tweetCard, isOverLimit && styles.tweetCardError]}
        testID={`tweet-card-${tweet.order}`}
      >
        <View style={styles.tweetHeader}>
          <View />
          <Text
            style={[styles.charCount, isOverLimit && styles.charCountError]}
            testID={`tweet-char-count-${tweet.order}`}
          >
            {charCount}/{TWEET_CHAR_LIMIT}
          </Text>
        </View>
        <Text style={styles.tweetText} testID={`tweet-text-${tweet.order}`}>
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
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    ...typography.label,
    color: colors.gray[500],
    fontWeight: '600',
    fontSize: 10,
  },
  connectingLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray[200],
    marginTop: spacing.xs,
    minHeight: spacing.md,
  },
  tweetCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  tweetCardError: {
    borderColor: colors.error,
  },
  tweetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  charCountError: {
    color: colors.error,
    fontWeight: '600',
  },
  tweetText: {
    ...typography.bodyLg,
    color: colors.gray[900],
  },
});
