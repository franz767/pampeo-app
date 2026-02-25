import { useState, useEffect, useMemo } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { partidosService } from '../../../src/services/partidos.service';
import { colors } from '../../../src/theme';

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function formatHora(hora: string): string {
  return hora?.substring(0, 5) || '';
}

export default function OwnerReservasScreen() {
  const router = useRouter();
  const { canchaId, nombre } = useLocalSearchParams<{ canchaId: string; nombre: string }>();
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hoy = new Date().toISOString().split('T')[0];

  const fetchReservas = async () => {
    if (!canchaId) return;
    try {
      setLoading(true);
      const data = await partidosService.getReservasPorCancha(canchaId);
      setReservas(data);
    } catch (err) {
      console.error('Error fetching reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, [canchaId]);

  const reservasActivas = useMemo(() => {
    return reservas.filter((r) => r.fecha >= hoy);
  }, [reservas, hoy]);

  const reservasPasadas = useMemo(() => {
    return reservas.filter((r) => r.fecha < hoy);
  }, [reservas, hoy]);

  const precioCancha = reservas[0]?.cancha?.precio_hora || 0;

  const renderReserva = ({ item }: { item: any }) => {
    const precio = item.cancha?.precio_hora || 0;
    const adelanto = precio / 2;
    const esPasada = item.fecha < hoy;

    return (
      <View style={[styles.reservaCard, esPasada && styles.reservaCardPasada]}>
        <View style={styles.reservaHeader}>
          <View style={styles.reservaDateBox}>
            <Text style={styles.reservaDay}>
              {new Date(item.fecha + 'T12:00:00').getDate()}
            </Text>
            <Text style={styles.reservaMonth}>
              {meses[new Date(item.fecha + 'T12:00:00').getMonth()]}
            </Text>
          </View>
          <View style={styles.reservaInfo}>
            <Text style={styles.reservaFecha}>{formatFecha(item.fecha)}</Text>
            <Text style={styles.reservaHora}>
              {formatHora(item.hora_inicio)} - {formatHora(item.hora_fin)}
            </Text>
          </View>
          <View style={[styles.estadoBadge, esPasada ? styles.estadoPasado : styles.estadoActivo]}>
            <Text style={[styles.estadoText, { color: esPasada ? colors.gray500 : '#D97706' }]}>
              {esPasada ? 'Pasado' : '50% Pagado'}
            </Text>
          </View>
        </View>

        <View style={styles.reservaBody}>
          <View style={styles.jugadorRow}>
            <View style={styles.jugadorAvatar}>
              <Text style={styles.jugadorInitial}>
                {(item.creador?.nombre_completo || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jugadorName}>
                {item.creador?.nombre_completo || 'Jugador'}
              </Text>
              <Text style={styles.jugadorPhone}>
                {item.creador?.telefono || 'Sin teléfono'}
              </Text>
            </View>
          </View>

          <View style={styles.pagoRow}>
            <View style={styles.pagoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.greenPrimary} />
              <Text style={styles.pagoLabel}>Adelanto</Text>
              <Text style={styles.pagoPagado}>S/{adelanto.toFixed(0)}</Text>
            </View>
            <View style={styles.pagoDivider} />
            <View style={styles.pagoItem}>
              <Ionicons name="cash-outline" size={16} color={colors.amber} />
              <Text style={styles.pagoLabel}>Te paga</Text>
              <Text style={styles.pagoPendiente}>S/{adelanto.toFixed(0)}</Text>
            </View>
            <View style={styles.pagoDivider} />
            <View style={styles.pagoItem}>
              <Ionicons name="wallet-outline" size={16} color={colors.gray500} />
              <Text style={styles.pagoLabel}>Total</Text>
              <Text style={styles.pagoTotal}>S/{precio.toFixed(0)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Reservas</Text>
          <Text style={styles.headerSubtitle}>{nombre || 'Cancha'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : reservas.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={56} color={colors.gray200} />
          <Text style={styles.emptyTitle}>Sin reservas</Text>
          <Text style={styles.emptySubtitle}>
            Aún no hay jugadores que hayan reservado esta cancha
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...reservasActivas, ...reservasPasadas]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchReservas} tintColor={colors.greenPrimary} />
          }
          ListHeaderComponent={
            reservasActivas.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próximas ({reservasActivas.length})</Text>
              </View>
            ) : null
          }
          renderItem={renderReserva}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
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
  list: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  reservaCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  reservaCardPasada: {
    opacity: 0.6,
  },
  reservaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  reservaDateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reservaDay: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.greenPrimary,
  },
  reservaMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  reservaInfo: {
    flex: 1,
  },
  reservaFecha: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  reservaHora: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoActivo: {
    backgroundColor: '#FEF3C7',
  },
  estadoPasado: {
    backgroundColor: colors.gray100,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reservaBody: {
    padding: 14,
  },
  jugadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jugadorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  jugadorInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  jugadorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  jugadorPhone: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 1,
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
    gap: 4,
  },
  pagoDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray200,
  },
  pagoLabel: {
    fontSize: 11,
    color: colors.gray500,
  },
  pagoPagado: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  pagoPendiente: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.amber,
  },
  pagoTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
  },
});
