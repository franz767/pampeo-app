import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSedes } from '../../../src/hooks/useSedes';
import { partidosService } from '../../../src/services/partidos.service';
import { colors } from '../../../src/theme';

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function getDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export default function BilleteraScreen() {
  const insets = useSafeAreaInsets();
  const { sedes, loading: sedesLoading } = useSedes();
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];

  const fetchAllReservas = async () => {
    if (sedesLoading || sedes.length === 0) return;
    try {
      const allReservas: any[] = [];
      for (const sede of sedes) {
        for (const cancha of (sede.canchas || [])) {
          const res = await partidosService.getReservasPorCancha(cancha.id);
          res.forEach((r: any) => {
            allReservas.push({
              ...r,
              canchaName: cancha.nombre,
              sedeName: sede.nombre,
            });
          });
        }
      }
      allReservas.sort((a, b) => b.fecha.localeCompare(a.fecha));
      setReservas(allReservas);
    } catch (err) {
      console.error('Error fetching reservas for billetera:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sedesLoading) fetchAllReservas();
  }, [sedesLoading, sedes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllReservas();
    setRefreshing(false);
  };

  // Calculate finances
  const mesActual = hoy.substring(0, 7); // YYYY-MM

  const stats = useMemo(() => {
    const reservasMes = reservas.filter(r => r.fecha.startsWith(mesActual));
    let totalEsperado = 0;
    let cobradoApp = 0;
    let cobradoDirecto = 0;

    reservasMes.forEach(r => {
      const precio = r.cancha?.precio_hora || 0;
      const adelanto = precio / 2;
      totalEsperado += precio;
      cobradoApp += adelanto; // 50% paid via app
      if (r.estado === 'finalizado') {
        cobradoDirecto += adelanto; // rest confirmed paid by owner
      }
    });

    const faltaCobrar = totalEsperado - cobradoApp - cobradoDirecto;

    return { totalEsperado, cobradoApp, cobradoDirecto, faltaCobrar };
  }, [reservas, mesActual, hoy]);

  // Last 7 days chart data
  const chartData = useMemo(() => {
    const days: { label: string; date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDaysAgo(i);
      const d = new Date(date + 'T12:00:00');
      const label = diasSemana[d.getDay()];
      const dayReservas = reservas.filter(r => r.fecha === date);
      const amount = dayReservas.reduce((sum: number, r: any) => sum + (r.cancha?.precio_hora || 0), 0);
      days.push({ label, date, amount });
    }
    return days;
  }, [reservas]);

  const maxChartAmount = Math.max(...chartData.map(d => d.amount), 1);

  const [showAllPayments, setShowAllPayments] = useState(false);

  // Payment history — 2 entries per reservation (app + directo)
  const allPayments = useMemo(() => {
    const entries: any[] = [];
    reservas.forEach(r => {
      const precio = r.cancha?.precio_hora || 0;
      const adelanto = precio / 2;

      // Entry 1: Cobro por App (50% adelanto) — always present for reservado/finalizado
      if (r.estado === 'reservado' || r.estado === 'finalizado') {
        entries.push({
          ...r,
          _key: r.id + '_app',
          precio,
          adelanto,
          estado: 'pagado_app' as const,
        });
      } else {
        // en_verificacion — still pending
        entries.push({
          ...r,
          _key: r.id + '_pending',
          precio,
          adelanto,
          estado: 'pendiente' as const,
        });
      }

      // Entry 2: Cobro directo (50% restante) — only when finalizado
      if (r.estado === 'finalizado') {
        entries.push({
          ...r,
          _key: r.id + '_directo',
          precio,
          adelanto,
          estado: 'pagado_directo' as const,
        });
      }
    });
    return entries;
  }, [reservas]);

  const paymentHistory = showAllPayments ? allPayments : allPayments.slice(0, 5);

  const isLoading = sedesLoading || loading;

  const mesLabel = (() => {
    const [y, m] = mesActual.split('-');
    const mesesFull = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${mesesFull[parseInt(m) - 1]} ${y}`;
  })();

  const renderPayment = ({ item }: { item: any }) => {
    const statusConfig = {
      pagado_app: { label: 'Pagado App', color: colors.greenPrimary, bg: colors.greenLight, icon: 'checkmark-circle' },
      pagado_directo: { label: 'Pagado Directo', color: '#2563EB', bg: '#DBEAFE', icon: 'cash' },
      pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
    };
    const config = statusConfig[item.estado as keyof typeof statusConfig];

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentLeft}>
          <View style={[styles.paymentIcon, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon as any} size={18} color={config.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentName}>{item.creador?.nombre_completo || 'Jugador'}</Text>
            <Text style={styles.paymentMeta}>
              {item.canchaName} · {formatFecha(item.fecha)}
            </Text>
          </View>
        </View>
        <View style={styles.paymentRight}>
          <Text style={styles.paymentAmount}>S/{item.adelanto.toFixed(0)}</Text>
          <View style={[styles.paymentBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.paymentBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Billetera</Text>
            <Text style={styles.headerSubtitle}>{mesLabel}</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Ionicons name="wallet" size={24} color={colors.greenPrimary} />
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total esperado</Text>
            <Text style={styles.summaryAmount}>S/{stats.totalEsperado.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Cobrado App</Text>
            <Text style={[styles.summaryAmount, { color: '#4ADE80' }]}>S/{stats.cobradoApp.toFixed(0)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Cobrado directo</Text>
            <Text style={[styles.summaryAmount, { color: '#93C5FD' }]}>S/{stats.cobradoDirecto.toFixed(0)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Falta cobrar</Text>
            <Text style={[styles.summaryAmount, { color: '#FDE68A' }]}>S/{stats.faltaCobrar.toFixed(0)}</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : (
        <FlatList
          data={paymentHistory}
          keyExtractor={(item) => item._key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.greenPrimary} />
          }
          ListHeaderComponent={
            <>
              {/* Bar Chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Ingresos últimos 7 días</Text>
                <View style={styles.chartContainer}>
                  {chartData.map((day, i) => {
                    const barHeight = maxChartAmount > 0 ? (day.amount / maxChartAmount) * 100 : 0;
                    const isToday = day.date === hoy;
                    return (
                      <View key={i} style={styles.chartBar}>
                        <Text style={styles.chartAmount}>
                          {day.amount > 0 ? `S/${day.amount}` : ''}
                        </Text>
                        <View style={styles.chartBarTrack}>
                          <LinearGradient
                            colors={isToday ? ['#22C55E', '#4ADE80'] : ['#D1FAE5', '#D1FAE5']}
                            style={[
                              styles.chartBarFill,
                              { height: Math.max(barHeight, 4) },
                            ]}
                          />
                        </View>
                        <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                          {day.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historial de pagos</Text>
                <Text style={styles.sectionCount}>{allPayments.length} registros</Text>
              </View>
            </>
          }
          renderItem={renderPayment}
          ListFooterComponent={
            allPayments.length > 5 ? (
              <TouchableOpacity
                style={styles.toggleBtn}
                onPress={() => setShowAllPayments(!showAllPayments)}
              >
                <Text style={styles.toggleBtnText}>
                  {showAllPayments ? 'Ver menos' : `Ver todos (${allPayments.length})`}
                </Text>
                <Ionicons
                  name={showAllPayments ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.greenPrimary}
                />
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyPayments}>
              <Ionicons name="receipt-outline" size={40} color={colors.gray300} />
              <Text style={styles.emptyPaymentsText}>Sin pagos registrados</Text>
            </View>
          }
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Bar Chart
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 130,
    gap: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  chartAmount: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.gray500,
    marginBottom: 4,
    height: 14,
  },
  chartBarTrack: {
    width: '70%',
    height: 100,
    backgroundColor: colors.gray50,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray400,
    marginTop: 6,
  },
  chartLabelToday: {
    color: colors.greenPrimary,
    fontWeight: '700',
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  sectionCount: {
    fontSize: 13,
    color: colors.gray400,
    fontWeight: '500',
  },
  // Payment Cards
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
  paymentMeta: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  emptyPayments: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyPaymentsText: {
    fontSize: 14,
    color: colors.gray400,
  },
});
