import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ScrollView as RNScrollView,
  Platform,
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

type Filtro = 'reservas' | 'partidos' | 'historial';

export default function MisPartidosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, jugador } = useAuth();
  const { partidos, loading, refetch } = useMisPartidos(jugador?.id);
  const [filtro, setFiltro] = useState<Filtro>('reservas');
  const [reservas, setReservas] = useState<ReservaConDetalles[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewReserva, setReviewReserva] = useState<ReservaConDetalles | null>(null);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const hoy = new Date().toISOString().split('T')[0];

  // Cargar reservas
  const fetchReservas = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await partidosService.getMisReservas(user.id);
      setReservas(data);
    } catch (err) {
      console.error('Error fetching reservas:', err);
    } finally {
      setLoadingReservas(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  // Check which reservas already have reviews
  useEffect(() => {
    if (!user?.id || reservas.length === 0) return;
    const checkReviews = async () => {
      const finalizadas = reservas.filter(r => r.estado === 'finalizado');
      const checked = new Set<string>();
      for (const r of finalizadas) {
        try {
          const hasReview = await partidosService.getResenaDePartido(r.id, user.id);
          if (hasReview) checked.add(r.id);
        } catch {}
      }
      setReviewedIds(checked);
    };
    checkReviews();
  }, [reservas, user?.id]);

  const onRefresh = async () => {
    await refetch();
    await fetchReservas();
  };

  const partidosFiltrados = useMemo(() => {
    if (filtro === 'partidos') {
      return partidos.filter((p) => p.fecha >= hoy && p.tipo !== 'reserva');
    }
    return [];
  }, [partidos, filtro, hoy]);

  // Reservas activas: en proceso y futuras
  const reservasActivas = useMemo(() => {
    return reservas.filter((r) =>
      (r.estado === 'en_verificacion' || r.estado === 'reservado') && r.fecha >= hoy
    );
  }, [reservas, hoy]);

  // Historial: finalizadas, canceladas, rechazadas, o pasadas
  const reservasHistorial = useMemo(() => {
    return reservas.filter((r) =>
      r.estado === 'finalizado' || r.estado === 'cancelado' || r.estado === 'rechazado' || r.fecha < hoy
    );
  }, [reservas, hoy]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'en_verificacion': return { label: 'En verificación', icon: 'time-outline', color: '#EA580C', bg: '#FFF7ED' };
      case 'reservado': return { label: '50% Pagado', icon: 'cash-outline', color: '#D97706', bg: '#FEF3C7' };
      case 'finalizado': return { label: 'Completada', icon: 'checkmark-circle', color: colors.greenPrimary, bg: colors.greenLight };
      case 'cancelado': return { label: 'Cancelada', icon: 'close-circle', color: colors.red, bg: '#FEE2E2' };
      case 'rechazado': return { label: 'Rechazada', icon: 'close-circle', color: colors.red, bg: '#FEE2E2' };
      default: return { label: estado, icon: 'help-circle', color: colors.gray500, bg: colors.gray100 };
    }
  };

  const handleOpenReview = (item: ReservaConDetalles) => {
    setReviewReserva(item);
    setReviewStars(0);
    setReviewComment('');
    setReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewReserva || !user?.id || reviewStars === 0) return;
    setReviewLoading(true);
    try {
      await partidosService.crearResena(
        reviewReserva.cancha_id,
        user.id,
        reviewReserva.id,
        reviewStars,
        reviewComment.trim() || undefined
      );
      setReviewedIds(prev => new Set(prev).add(reviewReserva.id));
      setReviewModal(false);
      Alert.alert('Gracias', 'Tu reseña fue enviada correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo enviar la reseña');
    } finally {
      setReviewLoading(false);
    }
  };

  const currentData = filtro === 'reservas' ? reservasActivas
    : filtro === 'historial' ? reservasHistorial
    : partidosFiltrados;

  const isLoading = filtro === 'partidos' ? loading : loadingReservas;
  const isEmpty = currentData.length === 0;

  const filterTabs: { key: Filtro; label: string; icon: string; count?: number }[] = [
    { key: 'reservas', label: 'Activas', icon: 'flag', count: reservasActivas.length },
    { key: 'partidos', label: 'Partidos', icon: 'football' },
    { key: 'historial', label: 'Historial', icon: 'time', count: reservasHistorial.length },
  ];

  const renderReservaCard = (item: ReservaConDetalles) => {
    const badge = getEstadoBadge(item.estado);
    const isHistorial = filtro === 'historial';
    const canReview = item.estado === 'finalizado' && !reviewedIds.has(item.id);
    const hasReviewed = item.estado === 'finalizado' && reviewedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.reservaCard, isHistorial && styles.reservaCardHistorial]}
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
          <View style={[styles.estadoBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.icon as any} size={12} color={badge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.estadoText, { color: badge.color }]}>{badge.label}</Text>
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

        {/* Payment Summary — only for active or finalizado */}
        {(item.estado !== 'cancelado' && item.estado !== 'rechazado') && (
          <View style={styles.pagoSection}>
            <View style={styles.pagoRow}>
              <View style={styles.pagoItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.greenPrimary} />
                <Text style={styles.pagoLabel}>Adelanto</Text>
                <Text style={styles.pagoPagado}>S/{((item.cancha?.precio_hora || 0) / 2).toFixed(0)}</Text>
              </View>
              <View style={styles.pagoDivider} />
              <View style={styles.pagoItem}>
                <Ionicons
                  name={item.estado === 'finalizado' ? 'checkmark-circle' : 'cash-outline'}
                  size={16}
                  color={item.estado === 'finalizado' ? colors.greenPrimary : '#D97706'}
                />
                <Text style={styles.pagoLabel}>{item.estado === 'finalizado' ? 'Pagado' : 'Resta'}</Text>
                {item.estado === 'finalizado' ? (
                  <Text style={styles.pagoPagado}>Completo</Text>
                ) : (
                  <Text style={styles.pagoPendiente}>S/{((item.cancha?.precio_hora || 0) / 2).toFixed(0)}</Text>
                )}
              </View>
              <View style={styles.pagoDivider} />
              <View style={styles.pagoItem}>
                <Ionicons name="wallet-outline" size={16} color={colors.gray500} />
                <Text style={styles.pagoLabel}>Total</Text>
                <Text style={styles.pagoTotal}>S/{(item.cancha?.precio_hora || 0).toFixed(0)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.reservaFooter}>
          {canReview ? (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => handleOpenReview(item)}
            >
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.reviewButtonText}>Dejar reseña</Text>
            </TouchableOpacity>
          ) : hasReviewed ? (
            <View style={styles.reviewedChip}>
              <Ionicons name="checkmark-circle" size={14} color={colors.greenPrimary} />
              <Text style={styles.reviewedText}>Reseña enviada</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.contactButtonText}>Contactar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.verButton}>
            <Text style={styles.verButtonText}>Ver detalles</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.greenPrimary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
                {tab.count != null && tab.count > 0 && (
                  <View style={[styles.badge, isActive && styles.badgeActive]}>
                    <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                      {tab.count}
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
              name={filtro === 'reservas' ? 'flag-outline' : filtro === 'historial' ? 'time-outline' : 'calendar-outline'}
              size={48}
              color={colors.gray400}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {filtro === 'reservas'
              ? 'No tienes reservas activas'
              : filtro === 'historial'
              ? 'No tienes historial de reservas'
              : 'No tienes partidos próximos'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filtro === 'reservas'
              ? 'Reserva una cancha para empezar a jugar'
              : filtro === 'historial'
              ? 'Tus reservas completadas aparecerán aquí'
              : 'Busca partidos disponibles o crea uno'}
          </Text>
        </View>
      ) : filtro === 'partidos' ? (
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
      ) : (
        <FlatList
          data={filtro === 'reservas' ? reservasActivas : reservasHistorial}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loadingReservas} onRefresh={onRefresh} tintColor={colors.greenPrimary} />
          }
          renderItem={({ item }) => renderReservaCard(item)}
        />
      )}

      {/* Review Modal */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <RNScrollView
              bounces={false}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Califica tu experiencia</Text>
                <Text style={styles.modalSubtitle}>
                  {reviewReserva?.cancha?.nombre} • {reviewReserva?.cancha?.sede?.nombre}
                </Text>

                {/* Stars */}
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewStars(star)}>
                      <Ionicons
                        name={star <= reviewStars ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= reviewStars ? '#F59E0B' : colors.gray300}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.starsLabel}>
                  {reviewStars === 0 ? 'Toca para calificar'
                    : reviewStars <= 2 ? 'Puede mejorar'
                    : reviewStars <= 3 ? 'Regular'
                    : reviewStars <= 4 ? 'Buena cancha'
                    : 'Excelente'}
                </Text>

                {/* Comment */}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Comentario opcional..."
                  placeholderTextColor={colors.gray400}
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  multiline
                  maxLength={200}
                />

                {/* Buttons */}
                <TouchableOpacity
                  style={[styles.submitBtn, reviewStars === 0 && styles.submitBtnDisabled]}
                  onPress={handleSubmitReview}
                  disabled={reviewStars === 0 || reviewLoading}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Enviar Reseña</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setReviewModal(false)}
                >
                  <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </RNScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  reservaCardHistorial: {
    opacity: 0.85,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
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
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  reviewedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.greenLight,
    borderRadius: 8,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.greenPrimary,
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
  // Review Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starsLabel: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 20,
  },
  commentInput: {
    width: '100%',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.gray900,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  cancelModalBtn: {
    paddingVertical: 12,
  },
  cancelModalBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray500,
  },
});
