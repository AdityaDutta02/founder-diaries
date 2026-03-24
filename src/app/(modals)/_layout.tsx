import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
      <Stack.Screen name="audio-recorder" options={{ presentation: 'transparentModal' }} />
      <Stack.Screen name="image-picker" />
      <Stack.Screen name="post-preview" />
      <Stack.Screen name="question-answer" />
    </Stack>
  );
}
