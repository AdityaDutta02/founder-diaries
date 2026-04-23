import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="audio-recorder" />
      <Stack.Screen name="image-picker" />
      <Stack.Screen name="post-preview" />
      <Stack.Screen name="question-answer" />
    </Stack>
  );
}
