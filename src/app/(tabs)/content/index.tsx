import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';

export default function ContentDashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
      testID="content-dashboard"
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Content</Text>
        <Pressable
          onPress={() => router.push('/content/queue')}
          style={({ pressed }) => [
            styles.queueBtn,
            { backgroundColor: colors.surface2, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Content queue"
          testID="content-queue-btn"
        >
          <Text style={[styles.queueBtnText, { color: colors.textSecondary }]}>Queue</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.emoji}>{'✍️'}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Coming Soon
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          AI-generated content from your diary entries - launching in a future update.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  queueBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  queueBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headingLg,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
    lineHeight: 22,
  },
});
