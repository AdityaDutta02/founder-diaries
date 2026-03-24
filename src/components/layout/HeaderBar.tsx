import React, { memo } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
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
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      testID={testID ?? 'header-bar'}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          gap: spacing.sm,
        }}
      >
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={{ padding: spacing.xs, marginRight: spacing.xs }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="header-back-button"
          >
            <Text
              style={{
                fontSize: 28,
                lineHeight: 30,
                color: colors.accent,
              }}
            >
              {'‹'}
            </Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.headingMd,
              fontFamily: fontFamily.semibold,
              color: colors.textPrimary,
            }}
            numberOfLines={1}
            testID="header-title"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                ...typography.bodySm,
                color: colors.textSecondary,
                marginTop: 2,
              }}
              numberOfLines={1}
              testID="header-subtitle"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? (
        <View style={{ marginLeft: spacing.md }} testID="header-right-action">
          {rightAction}
        </View>
      ) : null}
    </View>
  );
});
