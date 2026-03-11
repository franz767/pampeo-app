import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { useSedes } from '../../../src/hooks/useSedes';
import { partidosService } from '../../../src/services/partidos.service';
import { colors } from '../../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function formatHora(hora: string): string {
  return hora?.substring(0, 5) || '';
}

type FilterTab = 'por_confirmar' | 'proximas' | 'pasadas';

const MOTIVOS_RECHAZO = [
  'No me llegó el Yape',
  'Monto incorrecto',
  'Comprobante no válido',
  'Otro',
];

export default function OwnerAllReservasScreen() {
  const insets = useSafeAreaInsets();
  const { sedes, loading: sedesLoading } = useSedes();
  const [reservas, setReservas] = useState<any[]>([]);
  const [porConfirmar, setPorConfirmar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('por_confirmar');

  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [rejectingReserva, setRejectingReserva] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const hoy = new Date().toISOString().split('T')[0];

  const allCanchaIds = useMemo(() => {
    const ids: string[] = [];
    for (const sede of sedes) {
      for (const cancha of (sede.canchas || [])) {
        ids.push(cancha.id);
      }
    }
    return ids;
  }, [sedes]);

  const fetchAllData = useCallback(async () => {
    if (sedesLoading || sedes.length === 0) return;
    try {
      const allReservas: any[] = [];
      const [porConfirmarData] = await Promise.all([
        partidosService.getReservasPorConfirmar(allCanchaIds),
        (async () => {
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
        })(),
      ]);

      const porConfirmarConNombres = (porConfirmarData || []).map((r: any) => {
        const cancha = r.cancha;
        const sede = sedes.find(s => (s.canchas || []).some((c: any) => c.id === r.cancha_id));
        return {
          ...r,
          canchaName: cancha?.nombre || 'Cancha',
          sedeName: sede?.nombre || '',
        };
      });

      allReservas.sort((a, b) => {
        if (a.fecha === b.fecha) return (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
        return b.fecha.localeCompare(a.fecha);
      });

      setReservas(allReservas);
      setPorConfirmar(porConfirmarConNombres);
    } catch (err) {
      console.error('Error fetching reservas:', err);
    } finally {
      setLoading(false);
    }
  }, [sedesLoading, sedes, allCanchaIds]);

  useEffect(() => {
    if (!sedesLoading) fetchAllData();
  }, [sedesLoading, sedes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const filteredReservas = useMemo(() => {
    if (filter === 'proximas') return reservas.filter(r => r.fecha >= hoy);
    if (filter === 'pasadas') return reservas.filter(r => r.fecha < hoy);
    return [];
  }, [reservas, filter, hoy]);

  const proximasCount = useMemo(() => reservas.filter(r => r.fecha >= hoy).length, [reservas, hoy]);

  // ===== ACTIONS =====

  const handleConfirmar = async (reserva: any) => {
    Alert.alert(
      'Confirmar reserva',
      `¿Verificaste que recibiste S/${((reserva.cancha?.precio_hora || 0) / 2).toFixed(0)} en tu Yape?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, confirmar',
          onPress: async () => {
            setActionLoading(reserva.id);
            try {
              await partidosService.confirmarReserva(reserva.id);

              if (reserva.creador?.id) {
                await partidosService.crearNotificacion(
                  reserva.creador.id,
                  '¡Reserva Confirmada!',
                  `${reserva.canchaName} · ${formatFecha(reserva.fecha)} · ${formatHora(reserva.hora_inicio)}`,
                  'confirmacion'
                );
              }

              const tel = reserva.creador?.telefono?.replace(/\s/g, '');
              if (tel) {
                const precio = reserva.cancha?.precio_hora || 0;
                const restante = (precio / 2).toFixed(0);
                const msg = encodeURIComponent(
                  `🏟️ PAMPEO — Reserva Confirmada ✅\n` +
                  `Tu reserva en ${reserva.canchaName} para el ${formatFecha(reserva.fecha)} a las ${formatHora(reserva.hora_inicio)} ha sido confirmada. ¡Te esperamos!\n` +
                  `Recuerda: falta pagar S/${restante} al llegar.`
                );
                Linking.openURL(`https://wa.me/51${tel}?text=${msg}`).catch(() => {});
              }

              await fetchAllData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo confirmar');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = (reserva: any) => {
    setRejectingReserva(reserva);
  };

  const handleConfirmRechazo = async (motivo: string) => {
    if (!rejectingReserva) return;
    setActionLoading(rejectingReserva.id);
    try {
      await partidosService.rechazarReserva(rejectingReserva.id);

      if (rejectingReserva.creador?.id) {
        await partidosService.crearNotificacion(
          rejectingReserva.creador.id,
          'Reserva Rechazada',
          `El dueño no pudo verificar tu pago para ${rejectingReserva.canchaName}. Motivo: ${motivo}. Puedes intentar de nuevo o contactar al dueño.`,
          'sistema'
        );
      }

      setRejectingReserva(null);
      await fetchAllData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo rechazar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmarPagoTotal = async (reserva: any) => {
    const precio = reserva.cancha?.precio_hora || 0;
    const restante = (precio / 2).toFixed(0);
    Alert.alert(
      'Confirmar pago total',
      `¿El jugador ${reserva.creador?.nombre_completo || ''} pagó los S/${restante} restantes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, pagó',
          onPress: async () => {
            setActionLoading(reserva.id);
            try {
              await partidosService.confirmarPagoTotal(reserva.id);

              if (reserva.creador?.id) {
                await partidosService.crearNotificacion(
                  reserva.creador.id,
                  'Pago completo confirmado',
                  `Tu pago total por ${reserva.canchaName} el ${formatFecha(reserva.fecha)} ha sido confirmado. ¡Gracias!`,
                  'pago'
                );
              }

              await fetchAllData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo confirmar el pago');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // ===== RENDER CARDS =====

  const renderPorConfirmarCard = ({ item }: { item: any }) => {
    const precio = item.cancha?.precio_hora || 0;
    const adelanto = precio / 2;
    const isProcessing = actionLoading === item.id;

    return (
      <View style={styles.confirmCard}>
        <View style={styles.confirmCardHeader}>
          <View style={styles.confirmBadge}>
            <Ionicons name="time" size={14} color="#EA580C" />
            <Text style={styles.confirmBadgeText}>Por confirmar</Text>
          </View>
          <Text style={styles.confirmTimeAgo}>
            {formatFecha(item.fecha)} · {formatHora(item.hora_inicio)}
          </Text>
        </View>

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
          <View style={styles.montoBox}>
            <Text style={styles.montoLabel}>Monto</Text>
            <Text style={styles.montoValue}>S/{adelanto.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.canchaInfoRow}>
          <Ionicons name="football-outline" size={14} color={colors.greenPrimary} />
          <Text style={styles.canchaInfoText}>{item.canchaName} · {item.sedeName}</Text>
        </View>

        {item.comprobante_url && (
          <TouchableOpacity
            style={styles.comprobanteContainer}
            onPress={() => setImageModalUrl(item.comprobante_url)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: item.comprobante_url }}
              style={styles.comprobanteImage}
            />
            <View style={styles.comprobanteOverlay}>
              <Ionicons name="expand-outline" size={20} color={colors.white} />
              <Text style={styles.comprobanteOverlayText}>Toca para ver</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.verifyMessage}>
          <Ionicons name="information-circle" size={18} color="#6C2EB9" />
          <Text style={styles.verifyMessageText}>
            Revisa tu Yape y confirma que recibiste S/{adelanto.toFixed(0)}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleRechazar(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.red} />
            ) : (
              <>
                <Ionicons name="close-circle" size={18} color={colors.red} />
                <Text style={styles.rejectBtnText}>RECHAZAR</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => handleConfirmar(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                <Text style={styles.confirmBtnText}>CONFIRMAR RESERVA</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReserva = ({ item }: { item: any }) => {
    const precio = item.cancha?.precio_hora || 0;
    const adelanto = precio / 2;
    const esPasada = item.fecha < hoy;
    const esFinalizado = item.estado === 'finalizado';
    const esReservado = item.estado === 'reservado';
    const isProcessing = actionLoading === item.id;

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
            <Text style={styles.reservaCancha}>{item.canchaName} · {item.sedeName}</Text>
          </View>
          <View style={[
            styles.estadoBadge,
            esFinalizado ? styles.estadoCompleto
              : esPasada ? styles.estadoPasado
              : styles.estadoActivo
          ]}>
            <Ionicons
              name={esFinalizado ? 'checkmark-circle' : esReservado ? 'time-outline' : 'ellipse-outline'}
              size={12}
              color={esFinalizado ? colors.greenPrimary : esPasada ? colors.gray500 : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.estadoText, {
              color: esFinalizado ? colors.greenPrimary : esPasada ? colors.gray500 : '#D97706'
            }]}>
              {esFinalizado ? 'Pago completo' : esPasada ? 'Pasado' : '50% Pagado'}
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
              <Ionicons
                name={esFinalizado ? 'checkmark-circle' : 'cash-outline'}
                size={16}
                color={esFinalizado ? colors.greenPrimary : '#F59E0B'}
              />
              <Text style={styles.pagoLabel}>{esFinalizado ? 'Pagó' : 'Te paga'}</Text>
              <Text style={esFinalizado ? styles.pagoPagado : styles.pagoPendiente}>S/{adelanto.toFixed(0)}</Text>
            </View>
            <View style={styles.pagoDivider} />
            <View style={styles.pagoItem}>
              <Ionicons name="wallet-outline" size={16} color={colors.gray500} />
              <Text style={styles.pagoLabel}>Total</Text>
              <Text style={styles.pagoTotal}>S/{precio.toFixed(0)}</Text>
            </View>
          </View>

          {/* Botón confirmar pago total — solo para reservas activas con 50% pagado */}
          {esReservado && !esPasada && (
            <TouchableOpacity
              style={styles.pagoTotalBtn}
              onPress={() => handleConfirmarPagoTotal(item)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="cash" size={16} color={colors.white} />
                  <Text style={styles.pagoTotalBtnText}>Confirmar pago total</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const isLoading = sedesLoading || loading;
  const currentData = filter === 'por_confirmar' ? porConfirmar : filteredReservas;

  const filterTabs: { key: FilterTab; label: string; count: number; icon: string }[] = [
    { key: 'por_confirmar', label: 'Por confirmar', count: porConfirmar.length, icon: 'alert-circle-outline' },
    { key: 'proximas', label: 'Confirmadas', count: proximasCount, icon: 'checkmark-done-outline' },
    { key: 'pasadas', label: 'Pasadas', count: reservas.filter(r => r.fecha < hoy).length, icon: 'time-outline' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Reservas</Text>
        <Text style={styles.headerSubtitle}>
          {porConfirmar.length > 0
            ? `${porConfirmar.length} pendiente${porConfirmar.length > 1 ? 's' : ''} de verificación`
            : `${reservas.length} reserva${reservas.length !== 1 ? 's' : ''} en total`}
        </Text>

        <View style={styles.filterRow}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              onPress={() => setFilter(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={filter === tab.key ? colors.gray900 : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  filter === tab.key && styles.tabBadgeActive,
                  tab.key === 'por_confirmar' && tab.count > 0 && styles.tabBadgeUrgent,
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    filter === tab.key && styles.tabBadgeTextActive,
                    tab.key === 'por_confirmar' && tab.count > 0 && styles.tabBadgeTextUrgent,
                  ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={filter === 'por_confirmar' ? 'checkmark-done-outline' : 'calendar-outline'}
              size={48}
              color={colors.gray400}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'por_confirmar'
              ? 'Sin reservas pendientes'
              : filter === 'proximas'
              ? 'Sin reservas confirmadas'
              : 'Sin reservas pasadas'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'por_confirmar'
              ? 'No hay reservas esperando verificación'
              : 'Las reservas aparecerán aquí'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.greenPrimary} />
          }
          renderItem={filter === 'por_confirmar' ? renderPorConfirmarCard : renderReserva}
        />
      )}

      {/* Fullscreen Image Modal */}
      <Modal visible={!!imageModalUrl} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalUrl(null)}
          >
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
          {imageModalUrl && (
            <Image
              source={{ uri: imageModalUrl }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={!!rejectingReserva} transparent animationType="slide">
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>Motivo del rechazo</Text>
            <Text style={styles.rejectModalSubtitle}>
              Selecciona por qué rechazas esta reserva
            </Text>

            {MOTIVOS_RECHAZO.map((motivo) => (
              <TouchableOpacity
                key={motivo}
                style={styles.motivoItem}
                onPress={() => handleConfirmRechazo(motivo)}
                disabled={!!actionLoading}
              >
                <Ionicons name="radio-button-off" size={20} color={colors.red} />
                <Text style={styles.motivoText}>{motivo}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.rejectCancelBtn}
              onPress={() => setRejectingReserva(null)}
            >
              <Text style={styles.rejectCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: { backgroundColor: colors.white },
  filterTabText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  filterTabTextActive: { color: colors.gray900 },
  tabBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, marginLeft: 2,
  },
  tabBadgeActive: { backgroundColor: colors.gray200 },
  tabBadgeUrgent: { backgroundColor: '#EA580C' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  tabBadgeTextActive: { color: colors.gray700 },
  tabBadgeTextUrgent: { color: colors.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gray100,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray700 },
  emptySubtitle: { fontSize: 14, color: colors.gray400, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 100 },

  // POR CONFIRMAR CARD
  confirmCard: {
    backgroundColor: colors.white, borderRadius: 16, marginBottom: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08,
    shadowRadius: 10, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#EA580C',
  },
  confirmCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10,
  },
  confirmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF7ED',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  confirmBadgeText: { fontSize: 12, fontWeight: '700', color: '#EA580C' },
  confirmTimeAgo: { fontSize: 12, color: colors.gray500, fontWeight: '500' },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  jugadorAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  jugadorInitial: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  jugadorName: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  jugadorPhone: { fontSize: 13, color: colors.gray500, marginTop: 1 },
  montoBox: {
    alignItems: 'center', backgroundColor: colors.greenLight,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  montoLabel: { fontSize: 10, color: colors.gray500, fontWeight: '500' },
  montoValue: { fontSize: 18, fontWeight: '800', color: colors.greenPrimary },
  canchaInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, marginBottom: 10,
  },
  canchaInfoText: { fontSize: 13, color: colors.gray700, fontWeight: '500' },
  comprobanteContainer: {
    marginHorizontal: 14, marginBottom: 10, borderRadius: 12,
    overflow: 'hidden', position: 'relative',
  },
  comprobanteImage: { width: '100%', height: 180, backgroundColor: colors.gray100 },
  comprobanteOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8,
  },
  comprobanteOverlayText: { fontSize: 13, color: colors.white, fontWeight: '600' },
  verifyMessage: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14,
    marginBottom: 12, backgroundColor: '#F3E8FF', borderRadius: 10, padding: 12,
  },
  verifyMessageText: { fontSize: 13, color: '#6C2EB9', fontWeight: '600', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.red, backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { fontSize: 12, fontWeight: '700', color: colors.red },
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.greenPrimary,
  },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  // REGULAR RESERVA CARD
  reservaCard: {
    backgroundColor: colors.white, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
    shadowRadius: 6, elevation: 2,
  },
  reservaCardPasada: { opacity: 0.6 },
  reservaHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  reservaDateBox: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: colors.greenLight,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  reservaDay: { fontSize: 20, fontWeight: '800', color: colors.greenPrimary },
  reservaMonth: { fontSize: 11, fontWeight: '600', color: colors.greenPrimary },
  reservaInfo: { flex: 1 },
  reservaFecha: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  reservaHora: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  reservaCancha: { fontSize: 12, color: colors.greenPrimary, fontWeight: '600', marginTop: 2 },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  estadoActivo: { backgroundColor: '#FEF3C7' },
  estadoPasado: { backgroundColor: colors.gray100 },
  estadoCompleto: { backgroundColor: '#DCFCE7' },
  estadoText: { fontSize: 11, fontWeight: '700' },
  reservaBody: { padding: 14 },
  pagoRow: {
    flexDirection: 'row', backgroundColor: colors.gray50, borderRadius: 12,
    padding: 12, alignItems: 'center',
  },
  pagoItem: { flex: 1, alignItems: 'center', gap: 4 },
  pagoDivider: { width: 1, height: 30, backgroundColor: colors.gray200 },
  pagoLabel: { fontSize: 11, color: colors.gray500 },
  pagoPagado: { fontSize: 15, fontWeight: '700', color: colors.greenPrimary },
  pagoPendiente: { fontSize: 15, fontWeight: '700', color: '#F59E0B' },
  pagoTotal: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  pagoTotalBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0F2A14', borderRadius: 12, paddingVertical: 13, marginTop: 12,
  },
  pagoTotalBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },

  // FULLSCREEN IMAGE MODAL
  imageModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  imageModalImage: { width: SCREEN_WIDTH - 32, height: '70%' },

  // REJECT MODAL
  rejectModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  rejectModalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  rejectModalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900, marginBottom: 4 },
  rejectModalSubtitle: { fontSize: 14, color: colors.gray500, marginBottom: 20 },
  motivoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
    paddingHorizontal: 16, backgroundColor: '#FEF2F2', borderRadius: 12, marginBottom: 10,
  },
  motivoText: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  rejectCancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  rejectCancelText: { fontSize: 16, fontWeight: '600', color: colors.gray500 },
});