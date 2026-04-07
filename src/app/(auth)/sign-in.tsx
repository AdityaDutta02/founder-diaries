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
import { usePostHog } from 'posthog-react-native';
import { Button, EyeToggle, Input, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

function validate(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export default function SignInScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const posthog = usePostHog();
  const { setSession, setProfile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function clearErrors() {
    setEmailError('');
    setPasswordError('');
  }

  async function handleSignIn() {
    clearErrors();
    const error = validate(email, password);
    if (error) {
      if (error.toLowerCase().includes('email')) setEmailError(error);
      else setPasswordError(error);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        toast.show(authError.message, 'error');
        return;
      }

      if (data.session) {
        setSession(data.session);
        posthog.capture('user_signed_in', { method: 'email' });
        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, industry, niche_keywords, onboarding_completed, discovery_unlocked, timezone, created_at, updated_at, diary_start_date, expo_push_token')
            .eq('id', data.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }
        }
        router.replace('/(tabs)/diary');
      }
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
      testID="sign-in-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandArea} testID="logo-area">
          <Text style={[styles.wordmark, { color: colors.textPrimary, fontFamily: fontFamily.serif }]}>
            {'FOUNDER\nDIARIES'}
          </Text>
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            Your forge. Your story.
          </Text>
        </View>

        {/* Social auth buttons */}
        <View style={styles.socialRow}>
          <Pressable
            style={[styles.socialBtn, { backgroundColor: colors.textPrimary }]}
            testID="apple-sign-in"
          >
            <Text style={[styles.socialIcon, { color: colors.background }]}>{'⌘'}</Text>
            <Text style={[styles.socialLabel, { color: colors.background, fontFamily: fontFamily.semibold }]}>
              Continue with Apple
            </Text>
          </Pressable>
          <Pressable
            style={[styles.socialBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
            testID="google-sign-in"
          >
            <Text style={[styles.socialIcon, { color: colors.textPrimary }]}>{'G'}</Text>
            <Text style={[styles.socialLabel, { color: colors.textPrimary, fontFamily: fontFamily.semibold }]}>
              Continue with Google
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow} testID="divider">
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[typography.bodySm, { color: colors.textMuted }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="founder@startup.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={emailError}
            testID="email-input"
          />

          <View>
            <View style={styles.passwordHeader}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>
                Password
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                testID="forgot-password-link"
              >
                <Text style={[typography.bodySm, { color: colors.accent, fontFamily: fontFamily.semibold }]}>
                  Forgot?
                </Text>
              </Pressable>
            </View>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              textContentType="password"
              error={passwordError}
              testID="password-input"
              rightIcon={
                <EyeToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              }
            />
          </View>

          <Button
            label="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSignIn}
            testID="sign-in-button"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer} testID="sign-up-footer">
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            {"Don't have an account?"}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')} testID="create-account-link">
            <Text style={[typography.bodyMd, { color: colors.accent, fontFamily: fontFamily.semibold }]}>
              {' Sign Up'}
            </Text>
          </Pressable>
        </View>

        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['6xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  brandArea: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  wordmark: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 3,
  },
  socialRow: {
    gap: spacing.sm,
  },
  socialBtn: {
    height: 50,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  socialIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  socialLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  form: {
    gap: spacing.lg,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
