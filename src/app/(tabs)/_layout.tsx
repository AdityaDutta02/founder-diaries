import { Tabs } from 'expo-router';
import React from 'react';
import FloatingTabBar from '@/components/layout/FloatingTabBar';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function TabsLayout(): React.ReactElement {
  const contentEnabled = useFeatureFlag('content_generation');
  const discoverEnabled = useFeatureFlag('creator_discovery');

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="diary" options={{ title: 'Diary' }} />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          href: contentEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          href: discoverEnabled ? undefined : null,
        }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
