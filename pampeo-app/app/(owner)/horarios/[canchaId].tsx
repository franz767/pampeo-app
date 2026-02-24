import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useHorarios } from '../../../src/hooks/useHorarios';
import { colors } from '../../../src/theme';

const DIAS = [
  { label: 'LUN', value: 1 },
  { label: 'MAR', value: 2 },
  { label: 'MIE', value: 3 },
  { label: 'JUE', value: 4 },
  { label: 'VIE', value: 5 },
  { label: 'SAB', value: 6 },
  { label: 'DOM', value: 0 },
];

const DIA_NOMBRES: Record<number, string> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado',
};

const HORAS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00',
];

export default function HorariosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canchaId, nombre } = useLocalSearchParams<{ canchaId: string; nombre: string }>();
  const { loading, saving, getHorasForDia, saveDia } = useHorarios(canchaId || '');

  const [selectedDia, setSelectedDia] = useState(1); // Lunes por defecto
  const [horasSeleccionadas, setHorasSeleccionadas] = useState<Set<string>>(new Set());

  // Cargar horas del día seleccionado
  useEffect(() => {
    if (!loading) {
      setHorasSeleccionadas(new Set(getHorasForDia(selectedDia)));
    }
  }, [selectedDia, loading]);

  const toggleHora = (hora: string) => {
    const next = new Set(horasSeleccionadas);
    if (next.has(hora)) {
      next.delete(hora);
    } else {
      next.add(hora);
    }
    setHorasSeleccionadas(next);
  };

  const selectAll = () => {
    setHorasSeleccionadas(new Set(HORAS));
  };

  const clearAll = () => {
    setHorasSeleccionadas(new Set());
  };

  const handleSave = async () => {
    try {
      await saveDia(selectedDia, [...horasSeleccionadas].sort());
      Alert.alert('Guardado', `Horarios del ${DIA_NOMBRES[selectedDia]} actualizados`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron guardar los horarios');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
        <Text style={styles.loadingText}>Cargando horarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Gestionar Horarios</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{nombre || 'Cancha'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {DIAS.map((dia) => {
          const isActive = selectedDia === dia.value;
          const count = getHorasForDia(dia.value).size;
          return (
            <TouchableOpacity
              key={dia.value}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
              onPress={() => setSelectedDia(dia.value)}
            >
              <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                {dia.label}
              </Text>
              {count > 0 && (
                <View style={[styles.dayBadge, isActive && styles.dayBadgeActive]}>
                  <Text style={[styles.dayBadgeText, isActive && styles.dayBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>
          {DIA_NOMBRES[selectedDia]} — {horasSeleccionadas.size} horas
        </Text>
        <View style={styles.quickButtons}>
          <TouchableOpacity style={styles.quickButton} onPress={selectAll}>
            <Text style={styles.quickButtonText}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={clearAll}>
            <Text style={styles.quickButtonText}>Ninguna</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hours Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.hoursGrid}
        showsVerticalScrollIndicator={false}
      >
        {HORAS.map((hora) => {
          const isSelected = horasSeleccionadas.has(hora);
          const horaFin = `${String(parseInt(hora) + 1).padStart(2, '0')}:00`;
          return (
            <TouchableOpacity
              key={hora}
              style={[styles.hourCard, isSelected && styles.hourCardSelected]}
              onPress={() => toggleHora(hora)}
              activeOpacity={0.7}
            >
              <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                {hora}
              </Text>
              <Text style={[styles.hourRange, isSelected && styles.hourRangeSelected]}>
                a {horaFin}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color={colors.greenPrimary} style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Save Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.white} />
              <Text style={styles.saveButtonText}>
                Guardar {DIA_NOMBRES[selectedDia]}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.gray400,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.gray400,
    marginTop: 2,
  },
  // Day Selector
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
    backgroundColor: colors.gray50,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  dayChipActive: {
    backgroundColor: colors.greenPrimary,
    borderColor: colors.greenPrimary,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray500,
  },
  dayLabelActive: {
    color: colors.white,
  },
  dayBadge: {
    marginTop: 4,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  dayBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray500,
  },
  dayBadgeTextActive: {
    color: colors.white,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
  },
  // Hours Grid
  scrollView: {
    flex: 1,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
  },
  hourCard: {
    width: '30.5%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1.5,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  hourCardSelected: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenPrimary,
  },
  hourText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray500,
  },
  hourTextSelected: {
    color: colors.greenPrimary,
  },
  hourRange: {
    fontSize: 11,
    color: colors.gray400,
    marginTop: 2,
  },
  hourRangeSelected: {
    color: colors.greenPrimary,
  },
  checkIcon: {
    marginTop: 4,
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
  },
  saveButton: {
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
});
