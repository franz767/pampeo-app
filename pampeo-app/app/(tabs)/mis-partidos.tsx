import { useState, useMemo, useEffect } from 'react';
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
import { partidosService, ReservaConDetalles } from '../../src/services/partidos.service';
import { PartidoCard } from '../../src/components/partido/PartidoCard';
import { colors } from '../../src/theme';

type Filtro = 'reservas' | 'partidos' | 'pasados';

export default function MisPartidosScreen() {
  const router = useRouter();
  const { user, jugador } = useAuth();
  const { partidos, loading, refetch } = useMisPartidos(jugador?.id);
  const [filtro, setFiltro] = useState<Filtro>('reservas');
  const [reservas, setReservas] = useState<ReservaConDetalles[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);

  const hoy = new Date().toISOString().split('T')[0];

  // Cargar reservas
  useEffect(() => {
    if (!user?.id) return;
    const fetchReservas = async () => {
      try {
        const data = await partidosService.getMisReservas(user.id);
        setReservas(data);
      } catch (err) {
        console.error('Error fetching reservas:', err);
      } finally {
        setLoadingReservas(false);
      }
    };
    fetchReservas();
  }, [user?.id]);

  const onRefresh = async () => {
    await refetch();
    if (user?.id) {
      const data = await partidosService.getMisReservas(user.id);
      setReservas(data);
    }
  };

  const partidosFiltrados = useMemo(() => {
    if (filtro === 'partidos') {
      return partidos.filter((p) => p.fecha >= hoy && p.tipo !== 'reserva');
    }
    if (filtro === 'pasados') {
      return partidos.filter((p) => p.fecha < hoy);
    }
    return [];
  }, [partidos, filtro, hoy]);

  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => r.fecha >= hoy);
  }, [reservas, hoy]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const isLoading = filtro === 'reservas' ? loadingReservas : loading;
  const isEmpty = filtro === 'reservas' ? reservasFiltradas.length === 0 : partidosFiltrados.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Partidos</Text>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, filtro === 'reservas' && styles.filterTabActive]}
            onPress={() => setFiltro('reservas')}
          >
            <Text style={[styles.filterText, filtro === 'reservas' && styles.filterTextActive]}>
              Reservas
            </Text>
            {reservasFiltradas.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reservasFiltradas.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filtro === 'partidos' && styles.filterTabActive]}
            onPress={() => setFiltro('partidos')}
          >
            <Text style={[styles.filterText, filtro === 'partidos' && styles.filterTextActive]}>
              Partidos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filtro === 'pasados' && styles.filterTabActive]}
            onPress={() => setFiltro('pasados')}
          >
            <Text style={[styles.filterText, filtro === 'pasados' && styles.filterTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <Ionicons
            name={filtro === 'reservas' ? 'flag-outline' : 'calendar-outline'}
            size={56}
            color={colors.gray200}
          />
          <Text style={styles.emptyTitle}>
            {filtro === 'reservas'
              ? 'No tienes reservas activas'
              : filtro === 'partidos'
              ? 'No tienes partidos próximos'
              : 'No tienes historial de partidos'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filtro === 'reservas'
              ? 'Reserva una cancha para empezar a jugar'
              : 'Busca partidos disponibles o crea uno'}
          </Text>
        </View>
      ) : filtro === 'reservas' ? (
        <FlatList
          data={reservasFiltradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loadingReservas} onRefresh={onRefresh} tintColor={colors.greenPrimary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.reservaCard}
              onPress={() => router.push(`/partido/${item.id}` as any)}
            >
              {/* Header */}
              <View style={styles.reservaHeader}>
                <View style={styles.reservaIconContainer}>
                  <Ionicons name="flag" size={20} color={colors.greenPrimary} />
                </View>
                <View style={styles.reservaHeaderInfo}>
                  <Text style={styles.reservaTitle}>{item.cancha?.nombre}</Text>
                  <Text style={styles.reservaSede}>{item.cancha?.sede?.nombre}</Text>
                </View>
                <View style={[styles.estadoBadge, item.estado === 'reservado' ? styles.estadoPendiente : styles.estadoConfirmado]}>
                  <Text style={styles.estadoText}>
                    {item.estado === 'reservado' ? '50% Pagado' : 'Confirmado'}
                  </Text>
                </View>
              </View>

              {/* Detalles */}
              <View style={styles.reservaDetalles}>
                <View style={styles.detalleRow}>
                  <Ionicons name="calendar" size={16} color={colors.gray500} />
                  <Text style={styles.detalleText}>{formatDate(item.fecha)}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Ionicons name="time" size={16} color={colors.gray500} />
                  <Text style={styles.detalleText}>{item.hora_inicio?.substring(0, 5)}</Text>
                </View>
                <View style={styles.detalleRow}>
                  <Ionicons name="people" size={16} color={colors.gray500} />
                  <Text style={styles.detalleText}>{item.formato}</Text>
                </View>
              </View>

              {/* Estado de pago */}
              <View style={styles.pagoSection}>
                <View style={styles.pagoRow}>
                  <View style={styles.pagoItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.greenPrimary} />
                    <Text style={styles.pagoLabel}>Adelanto pagado</Text>
                    <Text style={styles.pagoPagado}>S/{((item.precio_por_jugador || 0) * (item.max_jugadores || 10) / 2).toFixed(2)}</Text>
                  </View>
                  <View style={styles.pagoItem}>
                    <Ionicons name="time" size={18} color={colors.amber} />
                    <Text style={styles.pagoLabel}>Falta pagar</Text>
                    <Text style={styles.pagoPendiente}>S/{((item.precio_por_jugador || 0) * (item.max_jugadores || 10) / 2).toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.pagoNote}>Pagar al dueño en efectivo, Yape o Plin</Text>
              </View>

              {/* Footer */}
              <View style={styles.reservaFooter}>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  <Text style={styles.contactButtonText}>Contactar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.verButton}>
                  <Text style={styles.verButtonText}>Ver detalles</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.greenPrimary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 6,
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
  badge: {
    backgroundColor: colors.greenPrimary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
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
  // Reserva Card Styles
  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  reservaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reservaHeaderInfo: {
    flex: 1,
  },
  reservaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  reservaSede: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoPendiente: {
    backgroundColor: '#FEF3C7',
  },
  estadoConfirmado: {
    backgroundColor: colors.greenLight,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
  },
  reservaDetalles: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalleText: {
    fontSize: 13,
    color: colors.gray700,
    fontWeight: '500',
  },
  pagoSection: {
    padding: 16,
    backgroundColor: colors.gray50,
  },
  pagoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  pagoItem: {
    alignItems: 'center',
    gap: 4,
  },
  pagoLabel: {
    fontSize: 11,
    color: colors.gray500,
  },
  pagoPagado: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  pagoPendiente: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber,
  },
  pagoNote: {
    fontSize: 11,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 4,
  },
  reservaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#25D366',
  },
  verButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
});
