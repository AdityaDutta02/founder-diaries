import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="industry-select" />
      <Stack.Screen name="platform-setup" />
      <Stack.Screen name="image-style" />
      <Stack.Screen name="quota-config" />
    </Stack>
  );
}
