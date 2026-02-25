import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/hooks/useAuth';
import { useMisPartidos } from '../../src/hooks/usePartido';
import { partidosService, ReservaConDetalles } from '../../src/services/partidos.service';
import { PartidoCard } from '../../src/components/partido/PartidoCard';
import { colors } from '../../src/theme';

type Filtro = 'reservas' | 'partidos' | 'pasados';

export default function MisPartidosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const filterTabs: { key: Filtro; label: string; icon: string }[] = [
    { key: 'reservas', label: 'Reservas', icon: 'flag' },
    { key: 'partidos', label: 'Partidos', icon: 'football' },
    { key: 'pasados', label: 'Historial', icon: 'time' },
  ];

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Mis Partidos</Text>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isActive = filtro === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setFiltro(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isActive ? colors.greenPrimary : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
                {tab.key === 'reservas' && reservasFiltradas.length > 0 && (
                  <View style={[styles.badge, isActive && styles.badgeActive]}>
                    <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                      {reservasFiltradas.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons
              name={filtro === 'reservas' ? 'flag-outline' : 'calendar-outline'}
              size={48}
              color={colors.gray400}
            />
          </View>
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
              activeOpacity={0.7}
            >
              {/* Header */}
              <View style={styles.reservaHeader}>
                <View style={styles.reservaIconContainer}>
                  <Ionicons name="flag" size={18} color={colors.greenPrimary} />
                </View>
                <View style={styles.reservaHeaderInfo}>
                  <Text style={styles.reservaTitle}>{item.cancha?.nombre}</Text>
                  <Text style={styles.reservaSede}>{item.cancha?.sede?.nombre}</Text>
                </View>
                <View style={[styles.estadoBadge, item.estado === 'reservado' ? styles.estadoPendiente : styles.estadoConfirmado]}>
                  <Text style={[styles.estadoText, item.estado !== 'reservado' && { color: colors.greenPrimary }]}>
                    {item.estado === 'reservado' ? '50% Pagado' : 'Confirmado'}
                  </Text>
                </View>
              </View>

              {/* Date + Time row */}
              <View style={styles.reservaDetalles}>
                <View style={styles.detalleChip}>
                  <Ionicons name="calendar" size={14} color={colors.greenPrimary} />
                  <Text style={styles.detalleText}>{formatDate(item.fecha)}</Text>
                </View>
                <View style={styles.detalleChip}>
                  <Ionicons name="time" size={14} color={colors.greenPrimary} />
                  <Text style={styles.detalleText}>{item.hora_inicio?.substring(0, 5)}</Text>
                </View>
              </View>

              {/* Payment Summary */}
              <View style={styles.pagoSection}>
                <View style={styles.pagoRow}>
                  <View style={styles.pagoItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.greenPrimary} />
                    <Text style={styles.pagoLabel}>Adelanto</Text>
                    <Text style={styles.pagoPagado}>S/{((item.cancha?.precio_hora || 0) / 2).toFixed(0)}</Text>
                  </View>
                  <View style={styles.pagoDivider} />
                  <View style={styles.pagoItem}>
                    <Ionicons name="cash-outline" size={16} color="#D97706" />
                    <Text style={styles.pagoLabel}>Resta</Text>
                    <Text style={styles.pagoPendiente}>S/{((item.cancha?.precio_hora || 0) / 2).toFixed(0)}</Text>
                  </View>
                  <View style={styles.pagoDivider} />
                  <View style={styles.pagoItem}>
                    <Ionicons name="wallet-outline" size={16} color={colors.gray500} />
                    <Text style={styles.pagoLabel}>Total</Text>
                    <Text style={styles.pagoTotal}>S/{(item.cancha?.precio_hora || 0).toFixed(0)}</Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.reservaFooter}>
                <TouchableOpacity style={styles.contactButton}>
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.contactButtonText}>Contactar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.verButton}>
                  <Text style={styles.verButtonText}>Ver detalles</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.greenPrimary} />
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
    backgroundColor: '#F5F7FA',
  },
  // Premium Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: colors.white,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  filterTextActive: {
    color: colors.gray900,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeActive: {
    backgroundColor: colors.greenPrimary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  badgeTextActive: {
    color: colors.white,
  },
  list: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
  },
  // Reserva Card
  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  reservaIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reservaHeaderInfo: {
    flex: 1,
  },
  reservaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  reservaSede: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 1,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
    color: '#D97706',
  },
  reservaDetalles: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  detalleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.gray50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detalleText: {
    fontSize: 13,
    color: colors.gray700,
    fontWeight: '600',
  },
  pagoSection: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  pagoRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  pagoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  pagoDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.gray200,
  },
  pagoLabel: {
    fontSize: 10,
    color: colors.gray500,
    fontWeight: '500',
  },
  pagoPagado: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  pagoPendiente: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D97706',
  },
  pagoTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
  reservaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 12,
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
