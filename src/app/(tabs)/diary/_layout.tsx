import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/theme/colors';

export default function DiaryLayout() {
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
        name="new"
        options={{
          title: 'New Entry',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[date]"
        options={{
          title: 'Entry',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
