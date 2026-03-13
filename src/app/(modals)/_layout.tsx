import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="audio-recorder" />
      <Stack.Screen name="image-picker" />
      <Stack.Screen name="post-preview" />
    </Stack>
  );
}
