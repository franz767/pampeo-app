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
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.greenPrimary,
          tabBarInactiveTintColor: colors.gray400,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 88 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 8,
          },
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: -2,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconBox : undefined}>
                <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="partidos"
          options={{
            title: 'Partidos',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconBox : undefined}>
                <Ionicons name={focused ? 'football' : 'football-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="mis-partidos"
          options={{
            title: 'Reservas',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconBox : undefined}>
                <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconBox : undefined}>
                <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  activeIconBox: {
    backgroundColor: colors.greenLight,
    borderRadius: 10,
    padding: 6,
    marginBottom: -4,
  },
});
