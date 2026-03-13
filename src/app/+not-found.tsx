import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container} testID="not-found-screen">
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.message}>
          The screen you are looking for does not exist.
        </Text>
        <Link href="/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
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
    backgroundColor: colors.white,
    padding: spacing['2xl'],
    gap: spacing.md,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...typography.headingLg,
    color: colors.gray[900],
    textAlign: 'center',
  },
  message: {
    ...typography.bodyMd,
    color: colors.gray[500],
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.md,
  },
  linkText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
