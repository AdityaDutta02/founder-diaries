import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, shadows, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface MenuRowProps {
  label: string;
  onPress: () => void;
  testID?: string;
}

const MenuRow = ({ label, onPress, testID }: MenuRowProps) => (
  <Pressable
    style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    onPress={onPress}
    accessibilityRole="button"
    testID={testID ?? `menu-row-${label}`}
  >
    <Text style={styles.menuRowLabel}>{label}</Text>
    <Text style={styles.menuRowArrow}>›</Text>
  </Pressable>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore((s) => ({
    profile: s.profile,
    signOut: s.signOut,
  }));

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

  return (
    <SafeAreaView style={styles.safeArea} testID="settings-screen">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard} testID="settings-profile-card">
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} testID="settings-name">
              {displayName}
            </Text>
            {profile?.email ? (
              <Text style={styles.profileEmail} testID="settings-email">
                {profile.email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuRow
            label="Platforms & Quotas"
            onPress={() => router.push('/(tabs)/settings/platforms')}
            testID="menu-platforms"
          />
          <View style={styles.divider} />
          <MenuRow
            label="Account"
            onPress={() => router.push('/(tabs)/settings/account')}
            testID="menu-account"
          />
          <View style={styles.divider} />
          <MenuRow
            label="Privacy Policy"
            onPress={() => {}}
            testID="menu-privacy"
          />
          <View style={styles.divider} />
          <MenuRow
            label="Terms of Service"
            onPress={() => {}}
            testID="menu-terms"
          />
          <View style={styles.divider} />
          <MenuRow
            label="About"
            onPress={() =>
              Alert.alert('Founder Diaries', 'Version 1.0.0\nBuilt with love for founders.')
            }
            testID="menu-about"
          />
        </View>

        {/* Sign out */}
        <Button
          label="Sign Out"
          variant="ghost"
          onPress={handleSignOut}
          style={styles.signOutButton}
          testID="sign-out-button"
        />

        {/* Version */}
        <Text style={styles.version} testID="app-version">
          v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.headingMd,
    color: colors.primary[600],
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...typography.headingSm,
    color: colors.gray[900],
  },
  profileEmail: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuRowPressed: {
    backgroundColor: colors.gray[50],
  },
  menuRowLabel: {
    ...typography.bodyLg,
    color: colors.gray[900],
  },
  menuRowArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.lg,
  },
  signOutButton: {
    alignSelf: 'center',
  },
  version: {
    ...typography.bodySm,
    color: colors.gray[400],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
