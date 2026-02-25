import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="horarios/[canchaId]" />
      <Stack.Screen name="reservas/[canchaId]" />
    </Stack>
  );
}
