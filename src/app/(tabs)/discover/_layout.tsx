import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[creatorId]" />
      <Stack.Screen name="profiles" />
    </Stack>
  );
}
