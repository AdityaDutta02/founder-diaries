import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/theme/ThemeContext';

export default function ContentLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[postId]"
        options={{
          title: 'Post',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="queue"
        options={{
          title: 'Content Queue',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
