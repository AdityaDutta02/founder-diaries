import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface MenuRowProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}

function MenuRow({ icon, label, value, onPress, danger = false, testID }: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuRow,
        { backgroundColor: pressed ? colors.surfacePressed : 'transparent' },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      testID={testID ?? `menu-row-${label}`}
    >
      <Text style={[styles.menuRowIcon, { color: colors.textMuted }]}>{icon}</Text>
      <Text
        style={[
          typography.bodyMd,
          styles.menuRowLabel,
          { color: danger ? colors.error : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[typography.bodyMd, { color: colors.textMuted }]}>{value}</Text>
      ) : null}
      <Text style={[styles.chevron, { color: danger ? colors.error : colors.textMuted }]}>›</Text>
    </Pressable>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
        },
      ]}
    >
      {children}
    </View>
  );
}

const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'Auto',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();

  const displayName = profile?.full_name ?? profile?.email ?? 'User';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((word: string) => word.charAt(0).toUpperCase())
    .join('');

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.auth.signOut();
            if (error) {
              logger.error('Sign out error', { error: error.message });
            }
            signOut();
            router.replace('/(auth)/sign-in');
          } catch (err) {
            logger.error('Unexpected sign out error', {
              error: err instanceof Error ? err.message : String(err),
            });
          }
        },
      },
    ]);
  }, [router, signOut]);

  const handleThemePress = useCallback(() => {
    const themeOptions: { label: string; value: ThemeMode }[] = [
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
      { label: 'Auto (System)', value: 'system' },
    ];
    Alert.alert(
      'Appearance',
      'Choose your preferred theme',
      [
        ...themeOptions.map((opt) => ({
          text: opt.label + (themeMode === opt.value ? ' ✓' : ''),
          onPress: () => setThemeMode(opt.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  }, [themeMode, setThemeMode]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="settings-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[typography.headingXl, { color: colors.textPrimary }]}>Settings</Text>

        {/* Profile card */}
        <Pressable
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
          onPress={() => router.push('/(tabs)/settings/account')}
          testID="settings-profile-card"
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.accentLight, borderRadius: spacing['3xl'] },
            ]}
          >
            <Text
              style={[
                typography.headingMd,
                { color: colors.accent, fontFamily: fontFamily.bold },
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text
              style={[typography.headingSm, { color: colors.textPrimary }]}
              testID="settings-name"
            >
              {displayName}
            </Text>
            {profile?.email ? (
              <Text
                style={[typography.bodySm, { color: colors.textSecondary }]}
                testID="settings-email"
              >
                {profile.email}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
        </Pressable>

        {/* Platforms section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>
            Platforms
          </Text>
          <SectionCard>
            <MenuRow
              icon="📱"
              label="Platforms & Quotas"
              onPress={() => router.push('/(tabs)/settings/platforms')}
              testID="menu-platforms"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="✍️"
              label="Writing Style"
              onPress={() => router.push('/(tabs)/settings/writing')}
              testID="menu-writing-style"
            />
          </SectionCard>
        </View>

        {/* Profile section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>
            Profile
          </Text>
          <SectionCard>
            <MenuRow
              icon="🏭"
              label="Industry & Niche"
              onPress={() => router.push('/(onboarding)/industry-select' as never)}
              testID="menu-industry-niche"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="🎨"
              label="Image Style"
              onPress={() => router.push('/(onboarding)/image-style' as never)}
              testID="menu-image-style"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="👤"
              label="Account Details"
              onPress={() => router.push('/(tabs)/settings/account')}
              testID="menu-account"
            />
          </SectionCard>
        </View>

        {/* Preferences section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>
            Preferences
          </Text>
          <SectionCard>
            <MenuRow
              icon="🎨"
              label="Appearance"
              value={THEME_MODE_LABELS[themeMode]}
              onPress={handleThemePress}
              testID="menu-appearance"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="🔔"
              label="Notifications"
              onPress={() => router.push('/(tabs)/settings/notifications')}
              testID="menu-notifications"
            />
          </SectionCard>
        </View>

        {/* Data section */}
        <View style={styles.section}>
          <Text style={[typography.label, styles.sectionLabel, { color: colors.textMuted }]}>
            Data
          </Text>
          <SectionCard>
            <MenuRow
              icon="📤"
              label="Export Diary"
              onPress={() => router.push('/(tabs)/settings/export')}
              testID="menu-export"
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="🗑️"
              label="Delete Account"
              onPress={() =>
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete all your data. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => router.push('/(tabs)/settings/account'),
                    },
                  ],
                )
              }
              danger
              testID="menu-delete-account"
            />
          </SectionCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <SectionCard>
            <MenuRow
              icon="🚪"
              label="Sign Out"
              onPress={handleSignOut}
              danger
              testID="sign-out-button"
            />
          </SectionCard>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[typography.bodySm, { color: colors.textMuted, textAlign: 'center' }]}
            testID="app-version"
          >
            v1.0.0
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => {}} testID="footer-privacy">
              <Text style={[typography.bodySm, { color: colors.textMuted }]}>Privacy Policy</Text>
            </Pressable>
            <Text style={[typography.bodySm, { color: colors.border }]}>·</Text>
            <Pressable onPress={() => {}} testID="footer-terms">
              <Text style={[typography.bodySm, { color: colors.textMuted }]}>Terms of Service</Text>
            </Pressable>
          </View>
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
  profileCard: {
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  menuRowIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  menuRowLabel: {
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
