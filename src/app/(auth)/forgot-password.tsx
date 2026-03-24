import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Input, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendReset() {
    setEmailError('');
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'founderdiaries://reset-password',
      });

      if (resetError) {
        toast.show(resetError.message, 'error');
        return;
      }

      setSent(true);
      toast.show('Reset link sent! Check your inbox.', 'success');
    } catch {
      toast.show('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="forgot-password-screen"
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[typography.headingXl, { color: colors.textPrimary }]}>
            Reset Password
          </Text>
          <Text style={[typography.bodyLg, { color: colors.textSecondary }]}>
            {"Enter the email address associated with your account and we'll send you a link to reset your password."}
          </Text>

          {sent ? (
            <View
              style={[
                styles.sentBox,
                { backgroundColor: colors.accentLight, borderRadius: borderRadius.md },
              ]}
              testID="sent-confirmation"
            >
              <Text style={[typography.bodyMd, { color: colors.accent }]}>
                A reset link has been sent to {email}. Check your inbox and spam folder.
              </Text>
            </View>
          ) : (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={emailError}
                testID="email-input"
                returnKeyType="send"
                onSubmitEditing={handleSendReset}
              />

              <Button
                label="Send Reset Link"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleSendReset}
                testID="send-reset-button"
              />
            </>
          )}

          <Pressable
            onPress={() => router.back()}
            style={styles.backLink}
            testID="back-to-sign-in-link"
          >
            <Text
              style={[
                typography.bodyMd,
                { color: colors.accent, fontFamily: fontFamily.medium },
              ]}
            >
              Back to Sign In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  content: {
    gap: spacing.xl,
  },
  sentBox: {
    padding: spacing.lg,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
});
