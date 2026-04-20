import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/theme/ThemeContext';
import { useDiarySync } from '@/hooks/useDiarySync';

function DiarySyncMount() {
  useDiarySync();
  return null;
}

export default function DiaryLayout() {
  const { colors } = useTheme();

  return (
    <>
      <DiarySyncMount />
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
          name="new"
          options={{
            title: 'New Entry',
            headerShown: false,
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
        <Stack.Screen
          name="edit/[localId]"
          options={{
            title: 'Edit Entry',
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
