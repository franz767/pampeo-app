import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(owner)" options={{ headerShown: false }} />
        <Stack.Screen name="cancha/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="partido/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="pago/yape" options={{ headerShown: false }} />
        <Stack.Screen name="pago/verificacion" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
