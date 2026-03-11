import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../../src/hooks/useAuth';
import { useSedes } from '../../../src/hooks/useSedes';
import { duenosService } from '../../../src/services/duenos.service';
import { colors } from '../../../src/theme';

export default function OwnerPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfil, dueno, signOut, refreshUserData } = useAuth();
  const { sedes, totalCanchas } = useSedes();

  const [yapeModalVisible, setYapeModalVisible] = useState(false);
  const [numeroYape, setNumeroYape] = useState(dueno?.numero_yape || '');
  const [nombreYape, setNombreYape] = useState(dueno?.nombre_yape || '');
  const [savingYape, setSavingYape] = useState(false);

  const firstName = perfil?.nombre_completo?.split(' ')[0] || 'Dueño';
  const avatarInitial = firstName[0]?.toUpperCase() || 'D';
  const yapeConfigured = !!dueno?.numero_yape && !!dueno?.nombre_yape;

  const handleSignOut = () => {
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

  const handleOpenYapeModal = () => {
    setNumeroYape(dueno?.numero_yape || '');
    setNombreYape(dueno?.nombre_yape || '');
    setYapeModalVisible(true);
  };

  const handleSaveYape = async () => {
    if (!numeroYape.trim()) {
      Alert.alert('Error', 'El número de Yape es obligatorio');
      return;
    }
    if (!nombreYape.trim()) {
      Alert.alert('Error', 'El nombre en Yape es obligatorio');
      return;
    }
    if (!dueno?.id) return;

    setSavingYape(true);
    try {
      await duenosService.actualizarDatosYape(dueno.id, {
        numero_yape: numeroYape.trim(),
        nombre_yape: nombreYape.trim(),
      });
      await refreshUserData();
      setYapeModalVisible(false);
      Alert.alert('Listo', 'Tus datos de Yape se guardaron correctamente');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron guardar los datos');
    } finally {
      setSavingYape(false);
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Datos personales', color: colors.greenPrimary, bg: colors.greenLight },
    { icon: 'business-outline', label: 'Mis sedes', color: '#2563EB', bg: '#DBEAFE', badge: `${sedes.length}` },
    { icon: 'football-outline', label: 'Mis canchas', color: '#F59E0B', bg: '#FEF3C7', badge: `${totalCanchas}` },
    { icon: 'notifications-outline', label: 'Notificaciones', color: '#8B5CF6', bg: '#EDE9FE' },
    { icon: 'help-circle-outline', label: 'Ayuda y soporte', color: colors.gray500, bg: colors.gray100 },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{perfil?.nombre_completo || 'Dueño'}</Text>
            <Text style={styles.profileEmail}>{perfil?.email || ''}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.greenPrimary} />
              <Text style={styles.roleBadgeText}>Administrador</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{sedes.length}</Text>
            <Text style={styles.statLabel}>{sedes.length === 1 ? 'Sede' : 'Sedes'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalCanchas}</Text>
            <Text style={styles.statLabel}>Canchas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons
              name={yapeConfigured ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={yapeConfigured ? '#4ADE80' : '#FBBF24'}
            />
            <Text style={styles.statLabel}>Yape</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }}>
        {/* Yape Config Card */}
        <TouchableOpacity style={styles.yapeCard} onPress={handleOpenYapeModal} activeOpacity={0.7}>
          <View style={styles.yapeCardLeft}>
            <View style={styles.yapeIconBox}>
              <Text style={{ fontSize: 22 }}>💜</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.yapeCardTitle}>Datos de Yape</Text>
              {yapeConfigured ? (
                <Text style={styles.yapeCardConfigured}>
                  {dueno?.numero_yape} · {dueno?.nombre_yape}
                </Text>
              ) : (
                <Text style={styles.yapeCardNotConfigured}>
                  Configura tu Yape para recibir pagos
                </Text>
              )}
            </View>
          </View>
          <View style={styles.yapeCardRight}>
            {!yapeConfigured && (
              <View style={styles.yapeWarningBadge}>
                <Text style={styles.yapeWarningText}>Requerido</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </View>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Pampeo v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Yape Modal */}
      <Modal visible={yapeModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <ScrollView
              bounces={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 28 }}>💜</Text>
                  <Text style={styles.modalTitle}>Configurar Yape</Text>
                  <Text style={styles.modalSubtitle}>
                    Los jugadores verán estos datos para yapear al reservar tu cancha
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Número de Yape *</Text>
                  <TextInput
                    style={styles.input}
                    value={numeroYape}
                    onChangeText={setNumeroYape}
                    placeholder="Ej: 987654321"
                    placeholderTextColor={colors.gray400}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre en Yape *</Text>
                  <TextInput
                    style={styles.input}
                    value={nombreYape}
                    onChangeText={setNombreYape}
                    placeholder="Ej: Juan Pérez"
                    placeholderTextColor={colors.gray400}
                    maxLength={50}
                  />
                  <Text style={styles.inputHint}>
                    Este nombre aparecerá al jugador para que verifique a quién yapea
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveBtn, savingYape && { opacity: 0.6 }]}
                  onPress={handleSaveYape}
                  disabled={savingYape}
                >
                  {savingYape ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                      <Text style={styles.saveBtnText}>Guardar datos de Yape</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setYapeModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: colors.white },
  profileName: { fontSize: 20, fontWeight: '800', color: colors.white },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Yape Card
  yapeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#E9D5FF',
  },
  yapeCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  yapeIconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E8FF',
    justifyContent: 'center', alignItems: 'center',
  },
  yapeCardTitle: { fontSize: 15, fontWeight: '700', color: colors.gray900 },
  yapeCardConfigured: { fontSize: 13, color: colors.greenPrimary, fontWeight: '500', marginTop: 2 },
  yapeCardNotConfigured: { fontSize: 12, color: '#EA580C', fontWeight: '500', marginTop: 2 },
  yapeCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  yapeWarningBadge: {
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  yapeWarningText: { fontSize: 10, fontWeight: '700', color: '#EA580C' },

  // Menu
  menuContainer: {
    backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray50,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.gray900 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { backgroundColor: colors.gray100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  menuBadgeText: { fontSize: 12, fontWeight: '700', color: colors.gray700 },

  // Bottom
  bottomSection: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100,
    alignItems: 'center', gap: 12,
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 14, width: '100%', borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  versionText: { fontSize: 12, color: colors.gray400 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.gray900, marginTop: 8 },
  modalSubtitle: { fontSize: 14, color: colors.gray500, textAlign: 'center', marginTop: 6 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: colors.gray900, backgroundColor: colors.gray50,
  },
  inputHint: { fontSize: 12, color: colors.gray400, marginTop: 6 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6C2EB9', paddingVertical: 16, borderRadius: 14, marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  cancelModalBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 6 },
  cancelModalText: { fontSize: 16, fontWeight: '600', color: colors.gray500 },
});