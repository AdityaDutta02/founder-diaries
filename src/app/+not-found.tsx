import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View
        style={[styles.container, { backgroundColor: colors.background }]}
        testID="not-found-screen"
      >
        <Text style={styles.emoji}>🔍</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Page not found</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          The screen you are looking for does not exist.
        </Text>
        <Link href={'/(tabs)' as never} style={styles.link}>
          <Text style={[styles.linkText, { color: colors.accent }]}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...typography.headingLg,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.bodyMd,
    fontWeight: '600',
  },
});
