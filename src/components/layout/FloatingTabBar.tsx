import React, { memo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { fontFamily } from '@/theme/typography';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Unicode glyphs matching v4 design intent (no icon lib required)
const TAB_ICONS: Record<string, string> = {
  diary:    '▤',
  content:  '✦',
  discover: '◉',
  settings: '⚙',
};

interface TabItemProps {
  name: string;
  label: string;
  active: boolean;
  onPress: () => void;
  accentColor: string;
  mutedColor: string;
}

const TabItem = memo(function TabItem({ name, label, active, onPress, accentColor, mutedColor }: TabItemProps) {
  const icon = TAB_ICONS[name] ?? '●';
  const color = active ? accentColor : mutedColor;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.icon, { color }]}>{icon}</Text>
      <Text style={[styles.label, { color, fontFamily: fontFamily.semibold }]}>
        {label}
      </Text>
    </Pressable>
  );
});

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const active = state.index === index;

        return (
          <TabItem
            key={route.key}
            name={route.name}
            label={label}
            active={active}
            accentColor={colors.accent}
            mutedColor={colors.textMuted}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  icon: {
    fontSize: Platform.OS === 'ios' ? 20 : 18,
    lineHeight: Platform.OS === 'ios' ? 24 : 22,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.2,
  },
});
