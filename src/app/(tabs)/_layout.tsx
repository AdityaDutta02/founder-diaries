import { Tabs } from 'expo-router';
import React from 'react';
import FloatingTabBar from '@/components/layout/FloatingTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="diary"    options={{ title: 'Diary' }} />
      <Tabs.Screen name="content"  options={{ title: 'Content' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
