import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  testID?: string;
}

export const HeaderBar = memo(function HeaderBar({
  title,
  subtitle,
  rightAction,
  showBack = false,
  testID,
}: HeaderBarProps) {
  const router = useRouter();

  return (
    <View style={styles.container} testID={testID ?? 'header-bar'}>
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="header-back-button"
          >
            <Text style={styles.backArrow}>{'←'}</Text>
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} testID="header-title">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1} testID="header-subtitle">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <View style={styles.rightSection} testID="header-right-action">
          {rightAction}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  backArrow: {
    fontSize: 22,
    color: colors.gray[700],
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...typography.headingLg,
    color: colors.gray[900],
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.gray[500],
    marginTop: 2,
  },
  rightSection: {
    marginLeft: spacing.md,
  },
});
