import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  const { jugador } = useAuth();
  const saldo = jugador?.saldo || 0;

  return (
    <View style={{ flex: 1 }}>
      {/* Saldo chip - esquina superior derecha */}
      <View style={styles.saldoContainer}>
        <View style={styles.saldoChip}>
          <Ionicons name="wallet-outline" size={14} color={colors.greenPrimary} />
          <Text style={styles.saldoText}>S/{saldo.toFixed(2)}</Text>
        </View>
      </View>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.greenPrimary,
          tabBarInactiveTintColor: colors.gray400,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.gray200,
            height: Platform.OS === 'ios' ? 85 : 70,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
          },
          tabBarShowLabel: false,
          tabBarIconStyle: {
            marginBottom: -4,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="partidos"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="football-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mis-partidos"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="people-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Centered FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  saldoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    right: 16,
    zIndex: 20,
  },
  saldoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  saldoText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 25,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});
