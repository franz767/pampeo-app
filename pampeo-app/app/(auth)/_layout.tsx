import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register-player" />
      <Stack.Screen name="register-owner" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
