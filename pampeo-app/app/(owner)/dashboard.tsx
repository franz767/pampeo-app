import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/hooks/useAuth';

import { useSedes } from '../../src/hooks/useSedes';
import { sedesService } from '../../src/services/sedes.service';
import { partidosService } from '../../src/services/partidos.service';
import { storageService } from '../../src/services/storage.service';
import { Cancha } from '../../src/types/database.types';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PENDING_SEDE_KEY = 'pendingSedeData';

const SUPERFICIE_LABEL: Record<string, string> = {
  grass_natural: 'Grass Natural',
  grass_sintetico: 'Grass Sintético',
  cemento: 'Cemento',
};

const CANCHA_IMAGES = [
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600&q=70',
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&q=70',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=70',
];

type TipoSuperficie = 'grass_natural' | 'grass_sintetico' | 'cemento';
type Capacidad = '5v5' | '6v6' | '5v5_6v6';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfil, dueno, signOut } = useAuth();
  const { sedes, loading, refetch, totalCanchas } = useSedes();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = sede, 2 = cancha

  // Sede form
  const [sedeName, setSedeName] = useState('');
  const [sedeDistrito, setSedeDistrito] = useState('');
  const [sedeTelefono, setSedeTelefono] = useState('');

  // Sede address
  const [sedeAddress, setSedeAddress] = useState('');

  // Cancha form
  const [canchaName, setCanchaName] = useState('');
  const [precioDia, setPrecioDia] = useState('');
  const [precioNoche, setPrecioNoche] = useState('');
  const [horaDiaInicio, setHoraDiaInicio] = useState('08:00');
  const [horaDiaFin, setHoraDiaFin] = useState('17:00');
  const [horaNocheInicio, setHoraNocheInicio] = useState('18:00');
  const [horaNocheFin, setHoraNocheFin] = useState('22:00');
  const [tipoSuperficie, setTipoSuperficie] = useState<TipoSuperficie>('grass_sintetico');
  const [capacidad, setCapacidad] = useState<Capacidad>('5v5');
  const [tieneIluminacion, setTieneIluminacion] = useState(true);
  const [tieneVestuarios, setTieneVestuarios] = useState(false);
  const [tieneEstacionamiento, setTieneEstacionamiento] = useState(false);
  const [canchaFoto, setCanchaFoto] = useState<string | null>(null);

  // Modal selector de hora
  const [horaModalVisible, setHoraModalVisible] = useState(false);
  const [horaModalField, setHoraModalField] = useState<'horaDiaInicio' | 'horaDiaFin' | 'horaNocheInicio' | 'horaNocheFin' | null>(null);

  const horasDisponibles = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00', '00:00',
  ];

  const formatHora = (hora: string) => {
    const [h] = hora.split(':');
    const hour = parseInt(h);
    if (hour === 0) return '12:00 am';
    if (hour < 12) return `${hour}:00 am`;
    if (hour === 12) return '12:00 pm';
    return `${hour - 12}:00 pm`;
  };

  const openHoraModal = (field: 'horaDiaInicio' | 'horaDiaFin' | 'horaNocheInicio' | 'horaNocheFin') => {
    setHoraModalField(field);
    setHoraModalVisible(true);
  };

  const selectHora = (hora: string) => {
    if (horaModalField === 'horaDiaInicio') setHoraDiaInicio(hora);
    else if (horaModalField === 'horaDiaFin') setHoraDiaFin(hora);
    else if (horaModalField === 'horaNocheInicio') setHoraNocheInicio(hora);
    else if (horaModalField === 'horaNocheFin') setHoraNocheFin(hora);
    setHoraModalVisible(false);
  };

  // Edit mode
  const [editingCancha, setEditingCancha] = useState<(Cancha & { sedeName: string; sedeAddress: string }) | null>(null);

  // Partido stats per cancha
  const [canchaStats, setCanchaStats] = useState<Record<string, { abiertos: number; llenos: number }>>({});
  const [reservasHoy, setReservasHoy] = useState(0);

  // Sede seleccionada (si ya tiene una)
  const [selectedSedeId, setSelectedSedeId] = useState<string | null>(null);
  const [creatingPending, setCreatingPending] = useState(false);
  const pendingChecked = useRef(false);

  // Fetch partido stats for all canchas
  useEffect(() => {
    if (loading || sedes.length === 0) return;
    const hoy = new Date().toISOString().split('T')[0];
    const fetchStats = async () => {
      const stats: Record<string, { abiertos: number; llenos: number }> = {};
      let reservasHoyCount = 0;
      for (const sede of sedes) {
        for (const cancha of (sede.canchas || [])) {
          try {
            const partidos = await partidosService.getPartidosPorCancha(cancha.id);
            stats[cancha.id] = {
              abiertos: partidos.filter(p => p.estado === 'abierto').length,
              llenos: partidos.filter(p => p.estado === 'lleno').length,
            };
            const reservas = await partidosService.getReservasPorCancha(cancha.id);
            reservasHoyCount += reservas.filter(r => r.fecha === hoy).length;
          } catch {
            stats[cancha.id] = { abiertos: 0, llenos: 0 };
          }
        }
      }
      setCanchaStats(stats);
      setReservasHoy(reservasHoyCount);
    };
    fetchStats();
  }, [loading, sedes]);

  // Auto-crear sede/canchas pendientes del registro
  useEffect(() => {
    if (loading || !dueno?.id || pendingChecked.current) return;
    pendingChecked.current = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PENDING_SEDE_KEY);
        if (!raw) return;

        const pending = JSON.parse(raw);
        if (!pending?.sede?.nombre) return;

        setCreatingPending(true);

        // Crear sede
        const sede = await sedesService.createSede({
          dueno_id: dueno.id,
          nombre: pending.sede.nombre,
          direccion: pending.sede.direccion || '',
          latitud: pending.sede.latitud || -11.775,
          longitud: pending.sede.longitud || -75.4972,
          telefono_contacto: pending.sede.telefono_contacto,
        });

        // Crear canchas
        if (pending.canchas?.length) {
          for (const cancha of pending.canchas) {
            const createdCancha = await sedesService.createCancha({
              sede_id: sede.id,
              nombre: cancha.nombre || 'Cancha 1',
              tipo_superficie: cancha.tipo_superficie || 'grass_sintetico',
              capacidad: cancha.capacidad || '5v5_6v6',
              precio_hora: cancha.precio_hora || 0,
            });

            // Upload foto if available
            if (cancha.foto_uri) {
              try {
                const fotoUrl = await storageService.uploadCanchaImage(cancha.foto_uri, createdCancha.id);
                await sedesService.updateCanchaFoto(createdCancha.id, fotoUrl);
              } catch (uploadErr) {
                console.error('Error uploading cancha photo:', uploadErr);
              }
            }
          }
        }

        await AsyncStorage.removeItem(PENDING_SEDE_KEY);
        await refetch();
      } catch (err) {
        console.error('Error creating pending sede:', err);
      } finally {
        setCreatingPending(false);
      }
    })();
  }, [loading, dueno?.id, refetch]);

  const resetForm = () => {
    setStep(1);
    setSedeName('');
    setSedeAddress('');
    setSedeDistrito('');
    setSedeTelefono('');
    setCanchaName('');
    setPrecioDia('');
    setPrecioNoche('');
    setHoraDiaInicio('08:00');
    setHoraDiaFin('17:00');
    setHoraNocheInicio('18:00');
    setHoraNocheFin('22:00');
    setTipoSuperficie('grass_sintetico');
    setCapacidad('5v5');
    setTieneIluminacion(true);
    setTieneVestuarios(false);
    setTieneEstacionamiento(false);
    setCanchaFoto(null);
    setSelectedSedeId(null);
    setEditingCancha(null);
  };

  const openModal = () => {
    resetForm();
    // Si ya tiene sedes, ir directo al paso 2
    if (sedes.length > 0) {
      setSelectedSedeId(sedes[0].id);
      setStep(2);
    }
    setModalVisible(true);
  };

  const openEditModal = (cancha: Cancha & { sedeName: string; sedeAddress: string }) => {
    resetForm();
    setEditingCancha(cancha);
    setCanchaName(cancha.nombre);
    setPrecioDia(String(cancha.precio_dia || cancha.precio_hora || ''));
    setPrecioNoche(String(cancha.precio_noche || ''));
    setHoraDiaInicio(cancha.horario_dia_inicio || '08:00');
    setHoraDiaFin(cancha.horario_dia_fin || '17:00');
    setHoraNocheInicio(cancha.horario_noche_inicio || '18:00');
    setHoraNocheFin(cancha.horario_noche_fin || '22:00');
    setTipoSuperficie(cancha.tipo_superficie as TipoSuperficie);
    setCapacidad(cancha.capacidad as Capacidad);
    setTieneIluminacion(cancha.tiene_iluminacion);
    setTieneVestuarios(cancha.tiene_vestuarios);
    setTieneEstacionamiento(cancha.tiene_estacionamiento);
    setCanchaFoto(cancha.foto_url || null);
    setSelectedSedeId(cancha.sede_id);
    setStep(2);
    setModalVisible(true);
  };

  const handleDeleteCancha = (canchaId: string, nombre: string) => {
    Alert.alert(
      'Eliminar cancha',
      `¿Estás seguro que quieres eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await sedesService.deleteCancha(canchaId);
              await refetch();
              Alert.alert('Eliminada', 'La cancha ha sido eliminada.');
            } catch (err: any) {
              const msg = err.message || '';
              if (msg.includes('foreign key') || msg.includes('violates')) {
                Alert.alert('No se puede eliminar', 'Esta cancha tiene partidos asociados. Elimina los partidos primero.');
              } else {
                Alert.alert('Error', msg || 'No se pudo eliminar la cancha');
              }
            }
          },
        },
      ]
    );
  };

  const handleNextStep = () => {
    if (!sedeName.trim()) {
      Alert.alert('Error', 'El nombre de la sede es obligatorio');
      return;
    }
    if (!sedeAddress.trim()) {
      Alert.alert('Error', 'La dirección es obligatoria');
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (!canchaName.trim()) {
      Alert.alert('Error', 'El nombre de la cancha es obligatorio');
      return;
    }
    if (!precioDia || parseFloat(precioDia) <= 0) {
      Alert.alert('Error', 'El precio de día debe ser mayor a 0');
      return;
    }
    if (!dueno?.id) {
      Alert.alert('Error', 'No se encontró tu perfil de dueño. Cierra sesión y vuelve a entrar.');
      return;
    }

    setSaving(true);
    try {
      let sedeId = selectedSedeId;

      // Crear sede si es nueva
      if (!sedeId) {
        const sede = await sedesService.createSede({
          dueno_id: dueno.id,
          nombre: sedeName.trim(),
          direccion: sedeAddress.trim(),
          distrito: sedeDistrito.trim() || undefined,
          telefono_contacto: sedeTelefono.trim() || undefined,
          latitud: -11.775,
          longitud: -75.4972,
        });
        sedeId = sede.id;
      }

      const canchaData = {
        sede_id: sedeId,
        nombre: canchaName.trim(),
        tipo_superficie: tipoSuperficie,
        capacidad,
        precio_hora: parseFloat(precioDia), // Mantener compatibilidad
        precio_dia: parseFloat(precioDia),
        precio_noche: parseFloat(precioNoche) || null,
        horario_dia_inicio: horaDiaInicio,
        horario_dia_fin: horaDiaFin,
        horario_noche_inicio: horaNocheInicio,
        horario_noche_fin: horaNocheFin,
        tiene_iluminacion: tieneIluminacion,
        tiene_vestuarios: tieneVestuarios,
        tiene_estacionamiento: tieneEstacionamiento,
      };

      let canchaId: string;

      if (editingCancha) {
        // Editar cancha existente
        await sedesService.updateCancha(editingCancha.id, canchaData);
        canchaId = editingCancha.id;

        // Upload nueva foto si cambió (URI local = nueva foto)
        if (canchaFoto && !canchaFoto.startsWith('http')) {
          try {
            const fotoUrl = await storageService.uploadCanchaImage(canchaFoto, canchaId);
            await sedesService.updateCanchaFoto(canchaId, fotoUrl);
          } catch (uploadErr) {
            console.error('Error uploading photo:', uploadErr);
          }
        }

        Alert.alert('Cancha actualizada', 'Los cambios han sido guardados.');
      } else {
        // Crear cancha nueva
        const createdCancha = await sedesService.createCancha(canchaData);
        canchaId = createdCancha.id;

        // Upload foto if selected
        if (canchaFoto) {
          try {
            const fotoUrl = await storageService.uploadCanchaImage(canchaFoto, canchaId);
            await sedesService.updateCanchaFoto(canchaId, fotoUrl);
          } catch (uploadErr) {
            console.error('Error uploading photo:', uploadErr);
          }
        }

        Alert.alert('Cancha registrada', 'Tu cancha ha sido creada exitosamente.');
      }
      setModalVisible(false);
      resetForm();
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar la cancha');
    } finally {
      setSaving(false);
    }
  };

  const pickCanchaFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir fotos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCanchaFoto(result.assets[0].uri);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/role-selection');
            } catch (err) {
              console.error('Error signing out:', err);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Collect all canchas across sedes
  const allCanchas: (Cancha & { sedeName: string; sedeAddress: string })[] = [];
  sedes.forEach((sede) => {
    (sede.canchas || []).forEach((cancha) => {
      allCanchas.push({
        ...cancha,
        sedeName: sede.nombre,
        sedeAddress: sede.direccion,
      });
    });
  });

  if (loading || creatingPending) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
        {creatingPending && (
          <Text style={{ marginTop: 12, fontSize: 14, color: colors.gray500 }}>
            Configurando tu sede...
          </Text>
        )}
      </View>
    );
  }

  const firstName = perfil?.nombre_completo?.split(' ')[0] || 'Dueño';
  const avatarInitial = firstName[0]?.toUpperCase() || 'D';

  return (
    <View style={styles.container}>
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerUserRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
            <View style={styles.headerUserInfo}>
              <Text style={styles.headerGreeting}>Hola, {firstName}</Text>
              <Text style={styles.headerRole}>Administrador</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCanchas}</Text>
            <Text style={styles.statLabel}>Canchas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reservasHoy}</Text>
            <Text style={styles.statLabel}>Reservas hoy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{sedes.length}</Text>
            <Text style={styles.statLabel}>{sedes.length === 1 ? 'Sede' : 'Sedes'}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.greenPrimary]}
            tintColor={colors.greenPrimary}
          />
        }
      >
        {allCanchas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="football-outline" size={48} color={colors.gray400} />
            </View>
            <Text style={styles.emptyTitle}>No tienes canchas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Registra tu primera cancha para que los jugadores puedan reservar.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openModal}>
              <Ionicons name="add-circle" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>Registrar mi primera cancha</Text>
            </TouchableOpacity>
          </View>
        ) : (
          sedes.map((sede) => {
            const canchasDeSede = (sede.canchas || []).map((c) => ({
              ...c,
              sedeName: sede.nombre,
              sedeAddress: sede.direccion,
            }));
            if (canchasDeSede.length === 0) return null;

            return (
              <View key={sede.id} style={styles.sedeSection}>
                {/* Sede Section Header */}
                <View style={styles.sedeSectionHeader}>
                  <View style={styles.sedeIconBox}>
                    <Ionicons name="location" size={16} color={colors.greenPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sedeSectionTitle}>{sede.nombre}</Text>
                    <Text style={styles.sedeSectionAddress} numberOfLines={1}>{sede.direccion}</Text>
                  </View>
                  <Text style={styles.sedeCanchaCount}>
                    {canchasDeSede.length} {canchasDeSede.length === 1 ? 'cancha' : 'canchas'}
                  </Text>
                </View>

                {/* Cancha Cards */}
                {canchasDeSede.map((cancha, index) => (
                  <View key={cancha.id} style={styles.canchaCard}>
                    {/* Card Top: Image + Info side by side */}
                    <View style={styles.canchaCardTop}>
                      <Image
                        source={{ uri: cancha.foto_url || CANCHA_IMAGES[index % CANCHA_IMAGES.length] }}
                        style={styles.canchaImage}
                      />
                      {/* Status badge on image */}
                      <View style={[
                        styles.statusBadge,
                        cancha.aprobado ? styles.statusApproved : styles.statusPending,
                      ]}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: cancha.aprobado ? colors.greenPrimary : '#F59E0B' },
                        ]} />
                        <Text style={[
                          styles.statusText,
                          { color: cancha.aprobado ? colors.greenPrimary : '#F59E0B' },
                        ]}>
                          {cancha.aprobado ? 'Activa' : 'Pendiente'}
                        </Text>
                      </View>

                      <View style={styles.canchaInfo}>
                        {/* Edit/Delete icons in top-right */}
                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => openEditModal(cancha)}
                          >
                            <Ionicons name="create-outline" size={16} color={colors.gray500} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cardActionBtn}
                            onPress={() => handleDeleteCancha(cancha.id, cancha.nombre)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.canchaName}>{cancha.nombre}</Text>

                        {/* Tags row */}
                        <View style={styles.tagsRow}>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>
                              {SUPERFICIE_LABEL[cancha.tipo_superficie] || cancha.tipo_superficie}
                            </Text>
                          </View>
                          <View style={styles.tag}>
                            <Text style={styles.tagText}>{cancha.capacidad}</Text>
                          </View>
                        </View>

                        {/* Price */}
                        <View style={styles.priceRow}>
                          <Text style={styles.priceAmount}>S/{cancha.precio_hora}</Text>
                          <Text style={styles.priceUnit}>/hora</Text>
                        </View>

                        {/* Service icons only */}
                        <View style={styles.servicesRow}>
                          {cancha.tiene_iluminacion && (
                            <View style={[styles.serviceIcon, { backgroundColor: '#FEF3C7' }]}>
                              <Ionicons name="bulb" size={14} color="#F59E0B" />
                            </View>
                          )}
                          {cancha.tiene_vestuarios && (
                            <View style={[styles.serviceIcon, { backgroundColor: '#DBEAFE' }]}>
                              <Ionicons name="shirt" size={14} color="#3B82F6" />
                            </View>
                          )}
                          {cancha.tiene_estacionamiento && (
                            <View style={[styles.serviceIcon, { backgroundColor: '#F3F4F6' }]}>
                              <Ionicons name="car" size={14} color="#6B7280" />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Horizontal Action Buttons */}
                    <View style={styles.cardButtonsRow}>
                      <TouchableOpacity
                        style={styles.horariosBtn}
                        onPress={() =>
                          router.push(
                            `/(owner)/horarios/${cancha.id}?nombre=${encodeURIComponent(cancha.nombre)}`
                          )
                        }
                      >
                        <Ionicons name="time-outline" size={16} color={colors.white} />
                        <Text style={styles.horariosBtnText}>Horarios</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reservasBtn}
                        onPress={() =>
                          router.push(
                            `/(owner)/reservas/${cancha.id}?nombre=${encodeURIComponent(cancha.nombre)}`
                          )
                        }
                      >
                        <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                        <Text style={styles.reservasBtnText}>Reservas</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB para agregar cancha */}
      {allCanchas.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={openModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Modal Registrar Cancha */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
              <Ionicons name="close" size={24} color={colors.gray500} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === 1 ? 'Nueva Sede' : editingCancha ? 'Editar Cancha' : 'Nueva Cancha'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Steps indicator */}
          {!selectedSedeId && (
            <View style={styles.stepsRow}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
            </View>
          )}

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 ? (
              <>
                {/* Sede Form */}
                <Text style={styles.formSectionTitle}>Datos de la sede</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la sede *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Complejo Deportivo Chupaca"
                    placeholderTextColor={colors.gray400}
                    value={sedeName}
                    onChangeText={setSedeName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Dirección *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Av. Los Héroes 583"
                    placeholderTextColor={colors.gray400}
                    value={sedeAddress}
                    onChangeText={setSedeAddress}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Distrito</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Chupaca"
                    placeholderTextColor={colors.gray400}
                    value={sedeDistrito}
                    onChangeText={setSedeDistrito}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Teléfono de contacto</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 919 123 456"
                    placeholderTextColor={colors.gray400}
                    value={sedeTelefono}
                    onChangeText={setSedeTelefono}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            ) : (
              <>
                {/* Cancha Form */}
                {sedes.length > 1 && selectedSedeId && (
                  <View style={styles.sedeSelector}>
                    <Text style={styles.inputLabel}>Sede</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      {sedes.map((sede) => (
                        <TouchableOpacity
                          key={sede.id}
                          style={[
                            styles.sedeChip,
                            selectedSedeId === sede.id && styles.sedeChipActive,
                          ]}
                          onPress={() => setSelectedSedeId(sede.id)}
                        >
                          <Text style={[
                            styles.sedeChipText,
                            selectedSedeId === sede.id && styles.sedeChipTextActive,
                          ]}>
                            {sede.nombre}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text style={styles.formSectionTitle}>Datos de la cancha</Text>

                {/* Foto de la cancha */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Foto de la cancha</Text>
                  <TouchableOpacity
                    style={styles.fotoPickerBtn}
                    onPress={pickCanchaFoto}
                    disabled={saving}
                  >
                    {canchaFoto ? (
                      <Image source={{ uri: canchaFoto }} style={styles.fotoPreview} />
                    ) : (
                      <View style={styles.fotoPlaceholder}>
                        <Ionicons name="camera-outline" size={32} color={colors.gray400} />
                        <Text style={styles.fotoPlaceholderText}>Agregar foto</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {canchaFoto && (
                    <TouchableOpacity
                      style={styles.fotoRemoveBtn}
                      onPress={() => setCanchaFoto(null)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.red} />
                      <Text style={styles.fotoRemoveText}>Quitar foto</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la cancha *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Cancha 1"
                    placeholderTextColor={colors.gray400}
                    value={canchaName}
                    onChangeText={setCanchaName}
                    editable={!saving}
                  />
                </View>

                {/* Precio Día */}
                <View style={styles.precioSection}>
                  <View style={styles.precioHeader}>
                    <View style={styles.precioIconContainer}>
                      <Ionicons name="sunny" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.precioLabel}>Día</Text>
                    <View style={styles.precioPriceContainer}>
                      <Text style={styles.precioPrefix}>S/</Text>
                      <TextInput
                        style={styles.precioInput}
                        placeholder="50"
                        placeholderTextColor={colors.gray400}
                        value={precioDia}
                        onChangeText={setPrecioDia}
                        keyboardType="numeric"
                        editable={!saving}
                      />
                    </View>
                  </View>
                  <View style={styles.horarioRow}>
                    <TouchableOpacity
                      style={styles.horaSelector}
                      onPress={() => openHoraModal('horaDiaInicio')}
                      disabled={saving}
                    >
                      <Text style={styles.horaSelectorText}>{formatHora(horaDiaInicio)}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.gray500} />
                    </TouchableOpacity>
                    <Text style={styles.horaSeparator}>a</Text>
                    <TouchableOpacity
                      style={styles.horaSelector}
                      onPress={() => openHoraModal('horaDiaFin')}
                      disabled={saving}
                    >
                      <Text style={styles.horaSelectorText}>{formatHora(horaDiaFin)}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.gray500} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Precio Noche */}
                <View style={styles.precioSection}>
                  <View style={styles.precioHeader}>
                    <View style={[styles.precioIconContainer, styles.precioIconNoche]}>
                      <Ionicons name="moon" size={20} color="#6366F1" />
                    </View>
                    <Text style={styles.precioLabel}>Noche</Text>
                    <View style={styles.precioPriceContainer}>
                      <Text style={styles.precioPrefix}>S/</Text>
                      <TextInput
                        style={styles.precioInput}
                        placeholder="80"
                        placeholderTextColor={colors.gray400}
                        value={precioNoche}
                        onChangeText={setPrecioNoche}
                        keyboardType="numeric"
                        editable={!saving}
                      />
                    </View>
                  </View>
                  <View style={styles.horarioRow}>
                    <TouchableOpacity
                      style={styles.horaSelector}
                      onPress={() => openHoraModal('horaNocheInicio')}
                      disabled={saving}
                    >
                      <Text style={styles.horaSelectorText}>{formatHora(horaNocheInicio)}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.gray500} />
                    </TouchableOpacity>
                    <Text style={styles.horaSeparator}>a</Text>
                    <TouchableOpacity
                      style={styles.horaSelector}
                      onPress={() => openHoraModal('horaNocheFin')}
                      disabled={saving}
                    >
                      <Text style={styles.horaSelectorText}>{formatHora(horaNocheFin)}</Text>
                      <Ionicons name="chevron-down" size={16} color={colors.gray500} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tipo superficie */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tipo de superficie *</Text>
                  <View style={styles.optionsRow}>
                    {([
                      { value: 'grass_sintetico', label: 'Sintético' },
                      { value: 'grass_natural', label: 'Natural' },
                      { value: 'cemento', label: 'Cemento' },
                    ] as { value: TipoSuperficie; label: string }[]).map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionChip, tipoSuperficie === opt.value && styles.optionChipActive]}
                        onPress={() => setTipoSuperficie(opt.value)}
                      >
                        <Text style={[styles.optionText, tipoSuperficie === opt.value && styles.optionTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Capacidad */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Capacidad *</Text>
                  <View style={styles.optionsRow}>
                    {([
                      { value: '5v5', label: '5 vs 5' },
                      { value: '6v6', label: '6 vs 6' },
                      { value: '5v5_6v6', label: 'Ambos' },
                    ] as { value: Capacidad; label: string }[]).map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionChip, capacidad === opt.value && styles.optionChipActive]}
                        onPress={() => setCapacidad(opt.value)}
                      >
                        <Text style={[styles.optionText, capacidad === opt.value && styles.optionTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Servicios */}
                <Text style={styles.formSectionTitle}>Servicios</Text>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                    <Text style={styles.switchLabel}>Iluminación</Text>
                  </View>
                  <Switch
                    value={tieneIluminacion}
                    onValueChange={setTieneIluminacion}
                    trackColor={{ false: colors.gray200, true: '#86EFAC' }}
                    thumbColor={tieneIluminacion ? colors.greenPrimary : colors.gray400}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Ionicons name="shirt-outline" size={20} color="#3B82F6" />
                    <Text style={styles.switchLabel}>Vestuarios</Text>
                  </View>
                  <Switch
                    value={tieneVestuarios}
                    onValueChange={setTieneVestuarios}
                    trackColor={{ false: colors.gray200, true: '#86EFAC' }}
                    thumbColor={tieneVestuarios ? colors.greenPrimary : colors.gray400}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Ionicons name="car-outline" size={20} color="#6B7280" />
                    <Text style={styles.switchLabel}>Estacionamiento</Text>
                  </View>
                  <Switch
                    value={tieneEstacionamiento}
                    onValueChange={setTieneEstacionamiento}
                    trackColor={{ false: colors.gray200, true: '#86EFAC' }}
                    thumbColor={tieneEstacionamiento ? colors.greenPrimary : colors.gray400}
                  />
                </View>
              </>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 12 }]}>
            {step === 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
                <Text style={styles.nextButtonText}>Siguiente</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <View style={styles.footerButtons}>
                {!selectedSedeId && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep(1)}
                    disabled={saving}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.gray700} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                      <Text style={styles.saveButtonText}>Registrar Cancha</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Selector de Hora */}
      <Modal
        visible={horaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHoraModalVisible(false)}
      >
        <View style={styles.horaModalOverlay}>
          <View style={styles.horaModalContent}>
            <View style={styles.horaModalHeader}>
              <Text style={styles.horaModalTitle}>Seleccionar hora</Text>
              <TouchableOpacity onPress={() => setHoraModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.horaModalScroll}>
              {horasDisponibles.map((hora) => (
                <TouchableOpacity
                  key={hora}
                  style={styles.horaOption}
                  onPress={() => selectHora(hora)}
                >
                  <Text style={styles.horaOptionText}>{formatHora(hora)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Premium Gradient Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  headerUserInfo: {},
  headerGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  headerRole: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Sede Sections
  sedeSection: {
    marginBottom: 8,
  },
  sedeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sedeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sedeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  sedeSectionAddress: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 1,
  },
  sedeCanchaCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray700,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.greenPrimary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Cancha Card - Compact
  canchaCard: {
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
  canchaCardTop: {
    flexDirection: 'row',
  },
  canchaImage: {
    width: 120,
    height: 140,
    backgroundColor: colors.gray100,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusApproved: {
    backgroundColor: 'rgba(240, 253, 244, 0.95)',
  },
  statusPending: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  canchaInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  cardActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canchaName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 6,
    paddingRight: 60,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.gray700,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.greenPrimary,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.gray400,
    marginLeft: 2,
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  serviceIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Card Action Buttons (horizontal)
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    paddingTop: 0,
  },
  horariosBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.greenPrimary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  horariosBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  reservasBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EBF5FF',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reservasBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray200,
  },
  stepDotActive: {
    backgroundColor: colors.greenPrimary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray200,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenPrimary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  optionTextActive: {
    color: colors.greenPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.gray700,
  },
  sedeSelector: {},
  sedeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginRight: 8,
  },
  sedeChipActive: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenPrimary,
  },
  sedeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  sedeChipTextActive: {
    color: colors.greenPrimary,
  },
  // Modal Footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  // Foto picker
  fotoPickerBtn: {
    marginBottom: 18,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  fotoPreview: {
    width: '100%',
    height: 180,
  },
  fotoPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    gap: 8,
  },
  fotoPlaceholderText: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: '600',
  },
  fotoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  fotoRemoveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Precios día/noche
  precioSection: {
    marginBottom: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  precioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  precioIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  precioIconNoche: {
    backgroundColor: '#EEF2FF',
  },
  precioLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  precioPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 90,
  },
  precioPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    marginRight: 2,
  },
  precioInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  horaSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  horaSelectorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
  },
  horaSeparator: {
    fontSize: 14,
    color: colors.gray500,
  },
  // Modal de hora
  horaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  horaModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  horaModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  horaModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
  },
  horaModalScroll: {
    paddingHorizontal: 16,
  },
  horaOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  horaOptionText: {
    fontSize: 16,
    color: colors.gray900,
    textAlign: 'center',
  },
});
