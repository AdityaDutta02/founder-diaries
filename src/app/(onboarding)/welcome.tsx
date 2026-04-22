import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

const FEATURES = [
  { icon: '✦', label: 'Write your story' },
  { icon: '◈', label: 'AI crafts your posts' },
  { icon: '◉', label: 'Approve and post' },
];

export default function WelcomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="welcome-screen"
    >
      <View style={styles.inner}>
        {/* Flame icon area */}
        <View
          style={[
            styles.iconArea,
            { backgroundColor: colors.warmSurface, borderRadius: borderRadius.xl },
          ]}
          testID="illustration-area"
        >
          <Text style={styles.flameIcon}>🔥</Text>
        </View>

        {/* Copy */}
        <View style={styles.copyArea}>
          <Text
            style={[
              styles.wordmark,
              { color: colors.textPrimary, fontFamily: fontFamily.serif },
            ]}
          >
            {'FOUNDER\nDIARIES'}
          </Text>
          <Text
            style={[typography.headingMd, { color: colors.textSecondary, textAlign: 'center' }]}
          >
            {'Your daily grind, turned into content that performs.'}
          </Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map(({ icon, label }) => (
            <View key={label} style={styles.featureRow}>
              <View
                style={[
                  styles.featureIconWrap,
                  { backgroundColor: colors.accentLight },
                ]}
              >
                <Text style={[styles.featureIcon, { color: colors.accent }]}>{icon}</Text>
              </View>
              <Text style={[typography.bodyMd, { color: colors.textPrimary }]}>{label}</Text>
            </View>
          ))}
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

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            {'Already have an account?'}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} testID="sign-in-link">
            <Text
              style={[
                typography.bodyMd,
                { color: colors.accent, fontFamily: fontFamily.semibold },
              ]}
            >
              {' Sign In'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing['2xl'],
    gap: spacing.xl,
    justifyContent: 'center',
  },
  iconArea: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIcon: {
    fontSize: 64,
  },
  copyArea: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 3,
    textAlign: 'center',
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 16,
    lineHeight: 20,
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
