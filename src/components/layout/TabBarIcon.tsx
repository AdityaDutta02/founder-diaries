import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

// Icon map — rendered as emoji/text since no icon library is installed.
// Replace with a vector icon library if added in the future.
const ICON_MAP: Record<string, string> = {
  // Tab icons
  home: '🏠',
  diary: '📓',
  content: '✨',
  profile: '👤',
  // Generic fallback
  default: '●',
};

interface TabBarIconProps {
  name: string;
  color: string;
  focused: boolean;
  badge?: boolean;
  testID?: string;
}

export const TabBarIcon = memo(function TabBarIcon({
  name,
  color,
  focused,
  badge = false,
  testID,
}: TabBarIconProps) {
  const { colors } = useTheme();
  const icon = ICON_MAP[name] ?? ICON_MAP.default;

  return (
    <View style={styles.container} testID={testID ?? `tab-icon-${name}`}>
      <Text
        style={[styles.icon, { opacity: focused ? 1 : 0.6 }, { tintColor: color } as object]}
        accessibilityLabel={name}
      >
        {icon}
      </Text>
      {badge && (
        <View
          style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.white }]}
          testID={`tab-icon-${name}-badge`}
          accessibilityLabel="Notification badge"
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});
