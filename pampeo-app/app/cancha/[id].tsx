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

function getFormatoInfo(capacidad: string, precioHora: number) {
  const formato: '5v5' | '6v6' = capacidad === '6v6' ? '6v6' : '5v5';
  const maxJugadores = formato === '5v5' ? 10 : 12;
  const precioPorJugador = Math.ceil(precioHora / maxJugadores);
  return { formato, maxJugadores, precioPorJugador };
}

interface Horario {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export default function CanchaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, jugador, refreshUserData } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [cancha, setCancha] = useState<CanchaConSede | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingCancha, setLoadingCancha] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

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

  // Precio por jugador basado en formato
  const formatoInfo = cancha ? getFormatoInfo(cancha.capacidad, cancha.precio_hora) : null;
  const precioPorJugador = formatoInfo?.precioPorJugador || 0;

  const handleBook = async () => {
    if (!user?.id || !jugador?.id || !cancha || !selectedSlot || !selectedDate || !formatoInfo) return;

    // Verificar saldo
    const saldo = jugador.saldo || 0;
    if (saldo < formatoInfo.precioPorJugador) {
      Alert.alert(
        'Saldo Insuficiente',
        `Necesitas S/${formatoInfo.precioPorJugador} para unirte.\nTu saldo actual: S/${saldo.toFixed(2)}`,
      );
      return;
    }

    setBookingLoading(true);
    try {
      // Buscar si ya existe un partido para este slot
      let partido = await partidosService.getPartidoPorSlot(cancha.id, selectedDate, selectedSlot);

      if (partido && partido.estado === 'lleno') {
        Alert.alert('Partido Lleno', 'Este horario ya está lleno. Intenta otro horario.');
        return;
      }

      // Si no existe, crear uno nuevo
      if (!partido) {
        const [h, m] = selectedSlot.split(':').map(Number);
        const horaFin = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        partido = await partidosService.crearPartido({
          cancha_id: cancha.id,
          creador_id: user.id,
          formato: formatoInfo.formato,
          fecha: selectedDate,
          hora_inicio: selectedSlot,
          hora_fin: horaFin,
          max_jugadores: formatoInfo.maxJugadores,
          precio_por_jugador: formatoInfo.precioPorJugador,
        });
      }

      // Unirse al partido (descuenta saldo automáticamente)
      await partidosService.unirseAPartido(partido.id, jugador.id);

      // Refrescar datos del usuario para actualizar saldo en UI
      await refreshUserData();

      // Navegar a la sala del partido
      router.push(`/partido/${partido.id}` as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo unir al partido');
    } finally {
      setBookingLoading(false);
    }
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
            source={{ uri: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80' }}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          {/* Header Buttons */}
          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => router.back()}
            >
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
          {/* Title & Status */}
          <View style={styles.titleRow}>
            <Text style={styles.venueName}>{cancha?.sede?.nombre || 'Cancha'}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ABIERTO</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={colors.greenPrimary} />
            <Text style={styles.addressText}>{cancha?.sede?.direccion || 'Sin dirección'}</Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>4.8</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= 4 ? 'star' : 'star-half'}
                  size={16}
                  color={colors.yellow}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>(120 reseñas)</Text>
          </View>

          {/* Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
          >
            <View style={styles.tag}>
              <Ionicons name="football-outline" size={14} color={colors.gray700} />
              <Text style={styles.tagText}>{superficieLabel[cancha?.tipo_superficie || ''] || cancha?.tipo_superficie} {cancha?.capacidad}</Text>
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
            {cancha?.tiene_estacionamiento && (
              <View style={styles.tag}>
                <Ionicons name="car-outline" size={14} color={colors.gray700} />
                <Text style={styles.tagText}>Estacionamiento</Text>
              </View>
            )}
          </ScrollView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Select Date */}
          <Text style={styles.sectionTitle}>Seleccionar Fecha</Text>
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />

          {/* Available Times */}
          <View style={styles.timesHeader}>
            <Text style={styles.sectionTitle}>Horarios Disponibles</Text>
            <Text style={styles.fieldLabel}>{cancha?.nombre} ({superficieLabel[cancha?.tipo_superficie || ''] || ''})</Text>
          </View>
          {slots.length === 0 ? (
            <View style={styles.noSlots}>
              <Ionicons name="calendar-outline" size={32} color={colors.gray400} />
              <Text style={styles.noSlotsText}>Sin horarios disponibles para este día</Text>
            </View>
          ) : (
            <TimeSlotGrid
              slots={slots}
              selectedSlot={selectedSlot}
              onSlotSelect={setSelectedSlot}
            />
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Top Review */}
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Mejor Reseña</Text>
              <Text style={styles.reviewDate}>hace 2 días</Text>
            </View>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewQuote}>
                "El mejor césped sintético de la ciudad. La iluminación es perfecta para partidos nocturnos."
              </Text>
              <View style={styles.reviewAuthor}>
                <View style={styles.authorAvatar}>
                  <Ionicons name="person" size={14} color={colors.gray400} />
                </View>
                <Text style={styles.authorName}>Carlos M.</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Booking Footer */}
      <BookingFooter
        total={selectedSlot ? precioPorJugador : 0}
        disabled={!selectedSlot || bookingLoading}
        onBook={handleBook}
        priceLabel="POR JUGADOR"
        buttonText={bookingLoading ? 'Uniendo...' : 'Unirme'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  // Hero
  heroContainer: {
    height: 260,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Content
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.greenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    color: colors.gray500,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewCount: {
    fontSize: 13,
    color: colors.gray400,
  },
  // Tags
  tagsContainer: {
    gap: 10,
    marginBottom: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray700,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: 20,
  },
  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 14,
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.greenPrimary,
    marginBottom: 14,
  },
  // Review
  reviewSection: {
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  reviewDate: {
    fontSize: 13,
    color: colors.gray400,
    marginBottom: 14,
  },
  reviewCard: {
    backgroundColor: colors.gray50,
    borderRadius: 14,
    padding: 16,
  },
  reviewQuote: {
    fontSize: 14,
    color: colors.gray700,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: colors.gray400,
  },
});
