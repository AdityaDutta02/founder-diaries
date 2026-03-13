import React, { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
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
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea} testID={testID}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[{ padding }, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <View style={[styles.container, { padding }, style]}>{children}</View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
