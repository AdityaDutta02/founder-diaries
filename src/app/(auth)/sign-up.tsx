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

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

function validate(fullName: string, email: string, password: string): FormErrors | null {
  const errors: FormErrors = {};
  if (!fullName.trim()) errors.fullName = 'Full name is required';
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export default function SignUpScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const posthog = usePostHog();
  const { setSession, setProfile } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignUp() {
    setErrors({});
    const validationErrors = validate(fullName, email, password);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (authError) {
        toast.show(authError.message, 'error');
        return;
      }

      if (data.user) {
        // Create profile row
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email.trim(),
          full_name: fullName.trim(),
          niche_keywords: [],
          onboarding_completed: false,
          discovery_unlocked: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        if (profileError) {
          toast.show('Account created but profile setup failed. Please contact support.', 'warning');
        }

        if (data.session) {
          setSession(data.session);
          posthog.capture('user_signed_up', { method: 'email' });
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, email, full_name, avatar_url, industry, niche_keywords, onboarding_completed, discovery_unlocked, timezone, created_at, updated_at, diary_start_date, expo_push_token')
            .eq('id', data.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }
        }

        router.replace('/(onboarding)/welcome');
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
      testID="sign-up-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandingArea} testID="logo-area">
          <Text
            style={[styles.wordmark, { color: colors.textPrimary, fontFamily: fontFamily.serif }]}
          >
            {'FOUNDER\nDIARIES'}
          </Text>
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            Your forge. Your story.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={errors.fullName}
            testID="full-name-input"
          />

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
            testID="email-input"
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
            testID="password-input"
            rightIcon={
              <EyeToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            }
          />

          <Button
            label="Create Account"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSignUp}
            testID="create-account-button"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer} testID="sign-in-footer">
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>
            Already have an account?
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} testID="sign-in-link">
            <Text
              style={[
                typography.bodyMd,
                { color: colors.accent, fontFamily: fontFamily.semibold },
              ]}
            >
              {' '}
              Sign In
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
    paddingTop: spacing['6xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  brandingArea: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  wordmark: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 3,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
