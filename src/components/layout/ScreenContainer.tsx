import React, { memo } from 'react';
import {
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { spacing } from '@/theme/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const ScreenContainer = memo(function ScreenContainer({
  children,
  scroll = true,
  padding = spacing.lg,
  style,
  testID,
}: ScreenContainerProps) {
  const { colors } = useTheme();

  const safeAreaStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  if (scroll) {
    return (
      <SafeAreaView style={safeAreaStyle} testID={testID}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ padding, paddingBottom: 24 }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeAreaStyle} testID={testID}>
      <View style={[{ flex: 1, padding, paddingBottom: 24 }, style]}>{children}</View>
    </SafeAreaView>
  );
});
