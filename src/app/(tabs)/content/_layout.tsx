import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/theme/colors';

export default function ContentLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.gray[900],
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
