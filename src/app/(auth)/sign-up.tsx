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
  const toast = useToast();
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
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profileData) {
            setProfile(profileData);
          }
        }

        router.replace('/(onboarding)/welcome');
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
      testID="sign-up-screen"
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
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')} testID="sign-in-link">
            <Text style={styles.footerLink}> Sign In</Text>
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
