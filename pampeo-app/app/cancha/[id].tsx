import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DateSelector from '../../src/components/booking/DateSelector';
import TimeSlotGrid, { TimeSlot } from '../../src/components/booking/TimeSlotGrid';
import BookingFooter from '../../src/components/booking/BookingFooter';
import { canchasService, CanchaConSede } from '../../src/services/canchas.service';
import { partidosService } from '../../src/services/partidos.service';
import { useAuth } from '../../src/hooks/useAuth';
import { colors } from '../../src/theme';

const COMISION_PAMPEO = 0.50; // S/0.50 por reserva

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

type ModalStep = 'options' | 'booking' | 'confirmation' | null;

export default function CanchaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, jugador, refreshUserData } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedFormato, setSelectedFormato] = useState<'5v5' | '6v6'>('5v5');
  const [cancha, setCancha] = useState<CanchaConSede | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingCancha, setLoadingCancha] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [reservaConfirmada, setReservaConfirmada] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [canchaData, horariosData] = await Promise.all([
          canchasService.getCanchaById(id),
          canchasService.getHorariosCancha(id),
        ]);
        setCancha(canchaData);
        setHorarios(horariosData || []);
        // Set default formato based on cancha capacity
        if (canchaData?.capacidad === '6v6') {
          setSelectedFormato('6v6');
        }
      } catch (err) {
        console.error('Error fetching cancha:', err);
      } finally {
        setLoadingCancha(false);
      }
    };
    fetchData();
  }, [id]);

  // Convert horarios to TimeSlot[] based on selected date's day of week
  const slots: TimeSlot[] = useMemo(() => {
    const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay();
    const dayHorarios = horarios.filter((h) => h.dia_semana === dayOfWeek);
    return dayHorarios
      .map((h) => ({
        hora: h.hora_inicio.substring(0, 5),
        precio: cancha?.precio_hora || 0,
        estado: 'disponible' as const,
      }))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [selectedDate, horarios, cancha]);

  // Reset selection when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  // Calcular precios
  const precioCancha = cancha?.precio_hora || 0;
  const adelanto50 = precioCancha / 2;
  const totalAPagar = adelanto50 + COMISION_PAMPEO;
  const restanteAlDueno = precioCancha - adelanto50;

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleOpenOptions = () => {
    if (!selectedSlot) {
      Alert.alert('Selecciona un horario', 'Debes seleccionar un horario disponible primero.');
      return;
    }
    setModalStep('options');
  };

  const handleSelectReservar = () => {
    setModalStep('booking');
  };

  const handleSelectRetar = () => {
    // Por ahora solo mostramos alerta - se implementará después
    Alert.alert('Próximamente', 'La función de retar con tu equipo estará disponible pronto.');
    setModalStep(null);
  };

  const handleConfirmReserva = async () => {
    if (!user?.id || !jugador?.id || !cancha || !selectedSlot || !selectedDate) return;

    const saldo = jugador.saldo || 0;
    if (saldo < totalAPagar) {
      Alert.alert(
        'Saldo Insuficiente',
        `Necesitas S/${totalAPagar.toFixed(2)} para reservar.\nTu saldo actual: S/${saldo.toFixed(2)}`,
      );
      return;
    }

    setBookingLoading(true);
    try {
      const [h, m] = selectedSlot.split(':').map(Number);
      const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Crear reserva (partido tipo reserva)
      const partido = await partidosService.crearReserva({
        cancha_id: cancha.id,
        creador_id: user.id,
        formato: selectedFormato,
        fecha: selectedDate,
        hora_inicio: selectedSlot,
        hora_fin: horaFin,
        precio_cancha: precioCancha,
        adelanto_pagado: adelanto50,
        comision_pampeo: COMISION_PAMPEO,
      });

      // Descontar saldo del jugador
      await partidosService.descontarSaldo(jugador.id, totalAPagar);

      // Refrescar datos del usuario
      await refreshUserData();

      // Guardar datos de confirmación
      setReservaConfirmada({
        cancha: cancha.nombre,
        sede: cancha.sede?.nombre,
        fecha: selectedDate,
        hora: selectedSlot,
        formato: selectedFormato,
        pagado: totalAPagar,
        restante: restanteAlDueno,
        duenoNombre: cancha.sede?.dueno?.perfil?.nombre_completo || 'Dueño',
        duenoTelefono: cancha.sede?.telefono_contacto || '999 999 999',
        partidoId: partido.id,
      });

      setModalStep('confirmation');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo completar la reserva');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    setModalStep(null);
    setSelectedSlot(null);
    router.replace('/(tabs)/mis-partidos');
  };

  const handleContactarWhatsApp = () => {
    const telefono = reservaConfirmada?.duenoTelefono?.replace(/\s/g, '');
    const mensaje = `Hola! Acabo de reservar la cancha ${reservaConfirmada?.cancha} para el ${formatDate(reservaConfirmada?.fecha)} a las ${reservaConfirmada?.hora}. Reservé por Pampeo.`;
    // En producción usar Linking.openURL
    Alert.alert('WhatsApp', `Contactar al ${telefono}\n\n${mensaje}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  if (loadingCancha) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
        <Text style={{ marginTop: 12, color: colors.gray400 }}>Cargando cancha...</Text>
      </View>
    );
  }

  const superficieLabel: Record<string, string> = {
    grass_natural: 'Natural',
    grass_sintetico: 'Sintético',
    cemento: 'Cemento',
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: cancha?.foto_url || 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroButton}>
                <Ionicons name="heart-outline" size={22} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroButton}>
                <Ionicons name="share-outline" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.venueName}>{cancha?.sede?.nombre || 'Cancha'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ABIERTO</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.greenPrimary} />
            <Text style={styles.addressText}>{cancha?.sede?.direccion || 'Sin dirección'}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>4.8</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name={star <= 4 ? 'star' : 'star-half'} size={16} color={colors.yellow} />
              ))}
            </View>
            <Text style={styles.reviewCount}>(120 reseñas)</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
            <View style={styles.tag}>
              <Ionicons name="football-outline" size={14} color={colors.gray700} />
              <Text style={styles.tagText}>{superficieLabel[cancha?.tipo_superficie || '']} {cancha?.capacidad}</Text>
            </View>
            {cancha?.tiene_iluminacion && (
              <View style={styles.tag}>
                <Ionicons name="bulb-outline" size={14} color={colors.gray700} />
                <Text style={styles.tagText}>Iluminación</Text>
              </View>
            )}
            {cancha?.tiene_vestuarios && (
              <View style={styles.tag}>
                <Ionicons name="shirt-outline" size={14} color={colors.gray700} />
                <Text style={styles.tagText}>Vestuarios</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Seleccionar Fecha</Text>
          <DateSelector selectedDate={selectedDate} onDateSelect={setSelectedDate} />

          <View style={styles.timesHeader}>
            <Text style={styles.sectionTitle}>Horarios Disponibles</Text>
            <Text style={styles.fieldLabel}>{cancha?.nombre} ({superficieLabel[cancha?.tipo_superficie || '']})</Text>
          </View>

          {slots.length === 0 ? (
            <View style={styles.noSlots}>
              <Ionicons name="calendar-outline" size={32} color={colors.gray400} />
              <Text style={styles.noSlotsText}>Sin horarios disponibles para este día</Text>
            </View>
          ) : (
            <TimeSlotGrid slots={slots} selectedSlot={selectedSlot} onSlotSelect={handleSelectSlot} />
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <BookingFooter
        total={selectedSlot ? adelanto50 : 0}
        disabled={!selectedSlot || bookingLoading}
        onBook={handleOpenOptions}
        priceLabel="50% ADELANTO"
        buttonText="Reservar"
      />

      {/* Modal de Opciones */}
      <Modal visible={modalStep === 'options'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Cómo quieres jugar?</Text>

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.optionCard} onPress={handleSelectReservar}>
                <View style={styles.optionIcon}>
                  <Ionicons name="flag" size={32} color={colors.greenPrimary} />
                </View>
                <Text style={styles.optionTitle}>RESERVAR</Text>
                <Text style={styles.optionSubtitle}>CANCHA</Text>
                <View style={styles.optionPriceContainer}>
                  <Text style={styles.optionPrice}>S/{adelanto50.toFixed(0)}</Text>
                  <Text style={styles.optionPriceLabel}>(mi 50%)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleSelectRetar}>
                <View style={styles.optionIcon}>
                  <Ionicons name="trophy" size={32} color={colors.greenPrimary} />
                </View>
                <Text style={styles.optionTitle}>RETAR</Text>
                <Text style={styles.optionSubtitle}>CON MI EQUIPO</Text>
                <View style={styles.optionPriceContainer}>
                  <Text style={styles.optionPrice}>S/{adelanto50.toFixed(0)}</Text>
                  <Text style={styles.optionPriceLabel}>(mi 50%)</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalStep(null)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Reserva */}
      <Modal visible={modalStep === 'booking'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => setModalStep('options')}>
              <Ionicons name="arrow-back" size={20} color={colors.gray700} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>

            <View style={styles.bookingHeader}>
              <Ionicons name="football" size={24} color={colors.greenPrimary} />
              <Text style={styles.bookingTitle}>Reservar Cancha</Text>
            </View>
            <Text style={styles.bookingSubtitle}>{cancha?.nombre} • {cancha?.sede?.nombre}</Text>

            <View style={styles.bookingDetails}>
              <View style={styles.bookingRow}>
                <Ionicons name="calendar" size={18} color={colors.greenPrimary} />
                <Text style={styles.bookingLabel}>Fecha:</Text>
                <Text style={styles.bookingValue}>{formatDate(selectedDate)}</Text>
              </View>
              <View style={styles.bookingRow}>
                <Ionicons name="time" size={18} color={colors.greenPrimary} />
                <Text style={styles.bookingLabel}>Hora:</Text>
                <Text style={styles.bookingValue}>{selectedSlot}</Text>
              </View>
              <View style={styles.bookingRow}>
                <Ionicons name="people" size={18} color={colors.greenPrimary} />
                <Text style={styles.bookingLabel}>Formato:</Text>
                <View style={styles.formatoSelector}>
                  <TouchableOpacity
                    style={[styles.formatoOption, selectedFormato === '5v5' && styles.formatoOptionActive]}
                    onPress={() => setSelectedFormato('5v5')}
                  >
                    <Text style={[styles.formatoText, selectedFormato === '5v5' && styles.formatoTextActive]}>5v5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formatoOption, selectedFormato === '6v6' && styles.formatoOptionActive]}
                    onPress={() => setSelectedFormato('6v6')}
                  >
                    <Text style={[styles.formatoText, selectedFormato === '6v6' && styles.formatoTextActive]}>6v6</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.paymentSummary}>
              <View style={styles.paymentIcon}>
                <Ionicons name="wallet" size={20} color={colors.greenPrimary} />
              </View>
              <Text style={styles.paymentTitle}>Resumen de pago:</Text>

              <View style={styles.paymentBox}>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Precio cancha:</Text>
                  <Text style={styles.paymentAmount}>S/{precioCancha.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Tu parte (50%):</Text>
                  <Text style={styles.paymentAmount}>S/{adelanto50.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentLabel}>Servicio Pampeo:</Text>
                  <Text style={styles.paymentAmount}>S/{COMISION_PAMPEO.toFixed(2)}</Text>
                </View>
                <View style={styles.paymentDivider} />
                <View style={styles.paymentLine}>
                  <Text style={styles.paymentTotalLabel}>Total a pagar:</Text>
                  <Text style={styles.paymentTotal}>S/{totalAPagar.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color={colors.blue} />
                <Text style={styles.infoText}>
                  El otro 50% (S/{restanteAlDueno.toFixed(0)}) lo pagarás al dueño directamente (efectivo, Yape, Plin, etc.)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, bookingLoading && styles.confirmButtonDisabled]}
              onPress={handleConfirmReserva}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="card" size={20} color={colors.white} />
                  <Text style={styles.confirmButtonText}>RESERVAR Y PAGAR S/{totalAPagar.toFixed(2)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal visible={modalStep === 'confirmation'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModalContent}>
            <View style={styles.confirmationIcon}>
              <Ionicons name="checkmark-circle" size={60} color={colors.greenPrimary} />
            </View>
            <Text style={styles.confirmationTitle}>¡Cancha Reservada!</Text>

            <View style={styles.confirmationDetails}>
              <View style={styles.confirmationRow}>
                <Ionicons name="location" size={16} color={colors.greenPrimary} />
                <Text style={styles.confirmationText}>{reservaConfirmada?.cancha} • {reservaConfirmada?.sede}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Ionicons name="calendar" size={16} color={colors.greenPrimary} />
                <Text style={styles.confirmationText}>{formatDate(reservaConfirmada?.fecha || '')} • {reservaConfirmada?.hora}</Text>
              </View>
              <View style={styles.confirmationRow}>
                <Ionicons name="people" size={16} color={colors.greenPrimary} />
                <Text style={styles.confirmationText}>{reservaConfirmada?.formato}</Text>
              </View>
            </View>

            <View style={styles.paymentStatus}>
              <View style={styles.paymentStatusRow}>
                <Ionicons name="wallet" size={16} color={colors.greenPrimary} />
                <Text style={styles.paymentStatusText}>Pagaste: S/{reservaConfirmada?.pagado?.toFixed(2)} (50%)</Text>
              </View>
              <View style={styles.paymentStatusRow}>
                <Ionicons name="cash" size={16} color={colors.amber} />
                <Text style={styles.paymentStatusText}>Falta pagar al dueño: S/{reservaConfirmada?.restante?.toFixed(0)}</Text>
              </View>
              <Text style={styles.paymentNote}>(efectivo, Yape, Plin, etc)</Text>
            </View>

            <View style={styles.contactBox}>
              <Ionicons name="call" size={16} color={colors.greenPrimary} />
              <Text style={styles.contactTitle}>Contacto del dueño:</Text>
              <Text style={styles.contactInfo}>{reservaConfirmada?.duenoNombre} • {reservaConfirmada?.duenoTelefono}</Text>
            </View>

            <TouchableOpacity style={styles.whatsappButton} onPress={handleContactarWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.white} />
              <Text style={styles.whatsappButtonText}>CONTACTAR POR WHATSAPP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.homeButton} onPress={handleCloseConfirmation}>
              <Ionicons name="home" size={18} color={colors.greenPrimary} />
              <Text style={styles.homeButtonText}>VER MIS RESERVAS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  heroContainer: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 34, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  venueName: { fontSize: 24, fontWeight: '800', color: colors.gray900, flex: 1 },
  statusBadge: { backgroundColor: colors.greenLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.greenBorder },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.greenPrimary },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  addressText: { fontSize: 14, color: colors.gray500 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  ratingValue: { fontSize: 16, fontWeight: '700', color: colors.gray900 },
  stars: { flexDirection: 'row', gap: 2 },
  reviewCount: { fontSize: 13, color: colors.gray400 },
  tagsContainer: { gap: 10, marginBottom: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200 },
  tagText: { fontSize: 13, fontWeight: '500', color: colors.gray700 },
  divider: { height: 1, backgroundColor: colors.gray100, marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray900, marginBottom: 14 },
  timesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 0 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.greenPrimary, marginBottom: 14 },
  noSlots: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  noSlotsText: { fontSize: 14, color: colors.gray400 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900, textAlign: 'center', marginBottom: 24 },
  optionsRow: { flexDirection: 'row', gap: 16 },
  optionCard: { flex: 1, backgroundColor: colors.gray50, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: colors.gray200 },
  optionIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.greenLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  optionTitle: { fontSize: 14, fontWeight: '800', color: colors.gray900 },
  optionSubtitle: { fontSize: 12, fontWeight: '600', color: colors.gray500, marginBottom: 12 },
  optionPriceContainer: { alignItems: 'center' },
  optionPrice: { fontSize: 24, fontWeight: '800', color: colors.greenPrimary },
  optionPriceLabel: { fontSize: 12, color: colors.gray500 },
  cancelButton: { marginTop: 20, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.gray500 },

  // Booking modal
  bookingModalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backButtonText: { fontSize: 14, color: colors.gray700 },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  bookingTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  bookingSubtitle: { fontSize: 14, color: colors.gray500, marginBottom: 20 },
  bookingDetails: { gap: 14, marginBottom: 20 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingLabel: { fontSize: 14, color: colors.gray500, width: 60 },
  bookingValue: { fontSize: 14, fontWeight: '600', color: colors.gray900, flex: 1 },
  formatoSelector: { flexDirection: 'row', gap: 10 },
  formatoOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 },
  formatoOptionActive: { backgroundColor: colors.greenPrimary, borderColor: colors.greenPrimary },
  formatoText: { fontSize: 14, fontWeight: '600', color: colors.gray700 },
  formatoTextActive: { color: colors.white },
  paymentSummary: { marginBottom: 20 },
  paymentIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  paymentTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  paymentBox: { backgroundColor: colors.gray50, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.gray200 },
  paymentLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  paymentLabel: { fontSize: 14, color: colors.gray600 },
  paymentAmount: { fontSize: 14, fontWeight: '600', color: colors.gray900 },
  paymentDivider: { height: 1, backgroundColor: colors.gray200, marginVertical: 8 },
  paymentTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  paymentTotal: { fontSize: 18, fontWeight: '800', color: colors.greenPrimary },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EBF5FF', borderRadius: 10, padding: 12, marginTop: 12 },
  infoText: { fontSize: 13, color: '#1E40AF', flex: 1, lineHeight: 18 },
  confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.greenPrimary, paddingVertical: 16, borderRadius: 12 },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },

  // Confirmation modal
  confirmationModalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  confirmationIcon: { marginBottom: 12 },
  confirmationTitle: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginBottom: 20 },
  confirmationDetails: { width: '100%', gap: 10, marginBottom: 20 },
  confirmationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmationText: { fontSize: 14, color: colors.gray700 },
  paymentStatus: { width: '100%', backgroundColor: colors.gray50, borderRadius: 12, padding: 16, marginBottom: 16 },
  paymentStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  paymentStatusText: { fontSize: 14, color: colors.gray700 },
  paymentNote: { fontSize: 12, color: colors.gray500, marginLeft: 24 },
  contactBox: { width: '100%', backgroundColor: colors.greenLight, borderRadius: 12, padding: 16, marginBottom: 20 },
  contactTitle: { fontSize: 14, fontWeight: '600', color: colors.gray700, marginTop: 8 },
  contactInfo: { fontSize: 15, fontWeight: '700', color: colors.gray900, marginTop: 4 },
  whatsappButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#25D366', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', marginBottom: 12 },
  whatsappButtonText: { fontSize: 14, fontWeight: '700', color: colors.white },
  homeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  homeButtonText: { fontSize: 14, fontWeight: '600', color: colors.greenPrimary },
});
