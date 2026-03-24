import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Media',
  'Consulting',
  'Real Estate',
  'Food & Beverage',
  'Other',
];

export default function AccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [industry, setIndustry] = useState(profile?.industry ?? '');
  const [nicheKeywords, setNicheKeywords] = useState<string[]>(
    profile?.niche_keywords ?? [],
  );
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string }>({});

  const handleAddKeyword = useCallback(() => {
    const trimmed = keywordInput.trim();
    if (!trimmed || nicheKeywords.includes(trimmed)) return;
    setNicheKeywords((prev) => [...prev, trimmed]);
    setKeywordInput('');
  }, [keywordInput, nicheKeywords]);

  const handleRemoveKeyword = useCallback((keyword: string) => {
    setNicheKeywords((prev) => prev.filter((k) => k !== keyword));
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile?.id) return;

    const errors: { fullName?: string } = {};
    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          industry: industry || null,
          niche_keywords: nicheKeywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update profile', { error: error.message });
        Alert.alert('Error', 'Failed to save changes. Please try again.');
        return;
      }

      setProfile({ ...profile, ...data });
      Alert.alert('Saved', 'Your account details have been updated.');
    } catch (err) {
      logger.error('Unexpected error saving account', {
        error: err instanceof Error ? err.message : String(err),
      });
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [profile, fullName, industry, nicheKeywords, setProfile]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!profile?.id) return;
            setIsDeleting(true);
            try {
              // Call an RPC or edge function for account deletion
              const { error } = await supabase.rpc('delete_user_account', {
                user_id: profile.id,
              });

              if (error) {
                logger.error('Failed to delete account', { error: error.message });
                Alert.alert('Error', 'Could not delete account. Please contact support.');
                return;
              }

              await supabase.auth.signOut();
              signOut();
              router.replace('/(auth)/sign-in');
            } catch (err) {
              logger.error('Unexpected error deleting account', {
                error: err instanceof Error ? err.message : String(err),
              });
              Alert.alert('Error', 'Something went wrong. Please contact support.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [profile?.id, router, signOut]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="account-screen"
    >
      <HeaderBar title="Account" showBack />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Full name */}
          <Input
            label="Full Name"
            placeholder="Your full name"
            value={fullName}
            onChangeText={setFullName}
            error={fieldErrors.fullName}
            autoCapitalize="words"
            testID="full-name-input"
          />

          {/* Email (read-only) */}
          <View style={styles.readOnlyField} testID="email-field">
            <Text
              style={[
                typography.label,
                { color: colors.textSecondary, marginBottom: spacing.xs },
              ]}
            >
              Email
            </Text>
            <View
              style={[
                styles.readOnlyInput,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text
                style={[typography.bodyMd, { color: colors.textMuted }]}
                testID="email-value"
              >
                {profile?.email ?? ''}
              </Text>
            </View>
            <Text style={[typography.bodySm, { color: colors.textMuted }]}>
              Email cannot be changed
            </Text>
          </View>

          {/* Industry selector */}
          <View testID="industry-selector">
            <Text
              style={[
                typography.label,
                { color: colors.textSecondary, marginBottom: spacing.sm },
              ]}
            >
              Industry
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.industryScroll}
            >
              {INDUSTRY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.industryChip,
                    {
                      borderColor: industry === option ? colors.accent : colors.border,
                      backgroundColor:
                        industry === option ? colors.accentLight : 'transparent',
                      borderRadius: borderRadius.full,
                    },
                  ]}
                  onPress={() => setIndustry(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: industry === option }}
                  testID={`industry-option-${option}`}
                >
                  <Text
                    style={[
                      typography.bodySm,
                      {
                        fontFamily:
                          industry === option ? fontFamily.semibold : fontFamily.regular,
                        color: industry === option ? colors.accent : colors.textSecondary,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Niche keywords */}
          <View testID="niche-keywords-section">
            <Text
              style={[
                typography.label,
                { color: colors.textSecondary, marginBottom: spacing.sm },
              ]}
            >
              Niche Keywords
            </Text>
            <View style={styles.keywordInputRow}>
              <View style={styles.keywordInputWrapper}>
                <Input
                  placeholder="Add a keyword..."
                  value={keywordInput}
                  onChangeText={setKeywordInput}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleAddKeyword}
                  testID="keyword-input"
                />
              </View>
              <Pressable
                style={[
                  styles.addKeywordButton,
                  { backgroundColor: colors.accent, borderRadius: borderRadius.md },
                ]}
                onPress={handleAddKeyword}
                accessibilityRole="button"
                accessibilityLabel="Add keyword"
                testID="add-keyword-button"
              >
                <Text
                  style={[styles.addKeywordText, { color: colors.accentText }]}
                >
                  +
                </Text>
              </Pressable>
            </View>
            {nicheKeywords.length > 0 && (
              <View style={styles.keywordsRow} testID="keywords-list">
                {nicheKeywords.map((kw) => (
                  <Badge key={kw} label={kw} onRemove={() => handleRemoveKeyword(kw)} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Save button */}
        <Button
          label="Save Changes"
          variant="primary"
          fullWidth
          isLoading={isSaving}
          onPress={handleSave}
          testID="save-changes-button"
        />

        {/* Delete account */}
        <View style={styles.dangerZone}>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            testID="delete-account-button"
            accessibilityRole="button"
          >
            <Text style={[typography.bodyMd, { color: colors.error }]}>
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  form: {
    gap: spacing.lg,
  },
  readOnlyField: {
    gap: spacing.xs,
  },
  readOnlyInput: {
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  industryScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  industryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
  },
  keywordInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  keywordInputWrapper: {
    flex: 1,
  },
  addKeywordButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addKeywordText: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 26,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dangerZone: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
