import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useMisPartidos } from '../../src/hooks/usePartido';
import { PartidoCard } from '../../src/components/partido/PartidoCard';
import { colors } from '../../src/theme';

type Filtro = 'proximos' | 'pasados';

export default function MisPartidosScreen() {
  const router = useRouter();
  const { jugador } = useAuth();
  const { partidos, loading, refetch } = useMisPartidos(jugador?.id);
  const [filtro, setFiltro] = useState<Filtro>('proximos');

  const hoy = new Date().toISOString().split('T')[0];

  const partidosFiltrados = useMemo(() => {
    if (filtro === 'proximos') {
      return partidos.filter((p) => p.fecha >= hoy);
    }
    return partidos.filter((p) => p.fecha < hoy);
  }, [partidos, filtro, hoy]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Partidos</Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filtro === 'proximos' && styles.filterTabActive]}
            onPress={() => setFiltro('proximos')}
          >
            <Text style={[styles.filterText, filtro === 'proximos' && styles.filterTextActive]}>
              Próximos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filtro === 'pasados' && styles.filterTabActive]}
            onPress={() => setFiltro('pasados')}
          >
            <Text style={[styles.filterText, filtro === 'pasados' && styles.filterTextActive]}>
              Pasados
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && partidos.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : partidosFiltrados.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={56} color={colors.gray200} />
          <Text style={styles.emptyTitle}>
            {filtro === 'proximos'
              ? 'No tienes partidos próximos'
              : 'No tienes partidos pasados'}
          </Text>
          <Text style={styles.emptySubtitle}>
            Busca partidos disponibles o crea uno desde una cancha
          </Text>
        </View>
      ) : (
        <FlatList
          data={partidosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.greenPrimary} />
          }
          renderItem={({ item }) => (
            <PartidoCard
              partido={item}
              esCreador={item.creador_id === jugador?.id}
              onPress={() => router.push(`/partido/${item.id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 4,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 0,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.greenPrimary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray400,
  },
  filterTextActive: {
    color: colors.greenPrimary,
  },
  list: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray700,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
  },
});
