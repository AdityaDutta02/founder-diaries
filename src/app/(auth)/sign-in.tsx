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
import { Button, EyeToggle, Input, useToast } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function validate(email: string, password: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export default function SignInScreen() {
  const toast = useToast();
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
        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }
        }
        router.replace('/(tabs)');
      }
    } catch (err) {
      toast.show('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      testID="sign-in-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea} testID="logo-area">
          <Text style={styles.logoEmoji}>📔</Text>
          <Text style={styles.heading}>Founder Diaries</Text>
          <Text style={styles.subtitle}>Turn your journey into content</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
          />

          <Input
            label="Password"
            placeholder="Enter your password"
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

          <Button
            label="Sign In"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleSignIn}
            testID="sign-in-button"
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
            testID="forgot-password-link"
          >
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow} testID="divider">
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign-up link */}
        <View style={styles.footer} testID="sign-up-footer">
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')} testID="create-account-link">
            <Text style={styles.footerLink}> Create Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
    gap: spacing['2xl'],
  },
  logoArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoEmoji: {
    fontSize: 56,
  },
  heading: {
    ...typography.headingXl,
    color: colors.gray[900],
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.gray[500],
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  forgotLink: {
    alignSelf: 'flex-end',
  },
  linkText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    ...typography.bodySm,
    color: colors.gray[400],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodyMd,
    color: colors.gray[500],
  },
  footerLink: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '600',
  },
});
