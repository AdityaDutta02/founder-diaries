import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button, StepDots } from '@/components/ui';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container} testID="welcome-screen">
      <View style={styles.inner}>
        {/* Illustration placeholder */}
        <View style={styles.illustrationArea} testID="illustration-area">
          <Text style={styles.illustrationEmoji}>📓</Text>
        </View>

        {/* Copy */}
        <View style={styles.copyArea}>
          <Text style={styles.heading}>
            Turn your daily founder journey into viral content
          </Text>
          <Text style={styles.body}>
            Record your day. We'll craft posts that match what works on each platform.
          </Text>
        </View>

        {/* CTA */}
        <Button
          label="Get Started"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(onboarding)/industry-select')}
          testID="get-started-button"
        />

        {/* Step dots */}
        <StepDots total={4} current={0} testID="welcome-step-dots" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing['2xl'],
    gap: spacing['2xl'],
    justifyContent: 'center',
  },
  illustrationArea: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  copyArea: {
    gap: spacing.md,
  },
  heading: {
    ...typography.headingXl,
    color: colors.gray[900],
    textAlign: 'center',
  },
  body: {
    ...typography.bodyLg,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
