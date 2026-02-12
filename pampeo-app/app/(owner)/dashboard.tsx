import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { perfil, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {perfil?.nombre_completo || 'Usuario'}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="business-outline" size={32} color="#10B981" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Sedes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="football-outline" size={32} color="#3B82F6" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Canchas</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={32} color="#8B5CF6" />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Reservas hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={32} color="#F59E0B" />
          <Text style={styles.statValue}>S/0</Text>
          <Text style={styles.statLabel}>Ingresos mes</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Acciones rapidas</Text>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="add-circle-outline" size={24} color="#10B981" />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Agregar nueva sede</Text>
          <Text style={styles.actionSubtitle}>Registra una nueva ubicacion</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="football-outline" size={24} color="#3B82F6" />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Agregar cancha</Text>
          <Text style={styles.actionSubtitle}>Anade una cancha a tu sede</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Cerrar sesion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    marginTop: 'auto',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
