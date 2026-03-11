import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export interface TimeSlot {
  hora: string;
  precio: number;
  estado: 'disponible' | 'ocupado' | 'pendiente' | 'mi_pendiente' | 'seleccionado';
  partidoId?: string;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (hora: string) => void;
  onPendientePress?: (partidoId: string) => void;
}

export default function TimeSlotGrid({ slots, selectedSlot, onSlotSelect, onPendientePress }: TimeSlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.hora;
        const isBooked = slot.estado === 'ocupado';
        const isPendiente = slot.estado === 'pendiente';
        const isMiPendiente = slot.estado === 'mi_pendiente';
        const isDisabled = isBooked || isPendiente;

        return (
          <TouchableOpacity
            key={slot.hora}
            style={[
              styles.slot,
              isBooked && styles.slotBooked,
              isPendiente && styles.slotPendiente,
              isMiPendiente && styles.slotMiPendiente,
              isSelected && styles.slotSelected,
            ]}
            onPress={() => {
              if (isMiPendiente && onPendientePress && slot.partidoId) {
                onPendientePress(slot.partidoId);
              } else if (!isDisabled) {
                onSlotSelect(slot.hora);
              }
            }}
            disabled={isBooked || isPendiente}
            activeOpacity={0.7}
          >
            {isSelected && <Text style={styles.selectedLabel}>ELEGIDO</Text>}
            {isBooked && <Text style={styles.bookedLabel}>RESERVADO</Text>}
            {isPendiente && <Text style={styles.pendienteLabel}>PENDIENTE</Text>}
            {isMiPendiente && (
              <View style={styles.miPendienteHeader}>
                <Ionicons name="time-outline" size={12} color="#D97706" />
                <Text style={styles.miPendienteLabel}>TU RESERVA</Text>
              </View>
            )}
            <Text
              style={[
                styles.hora,
                isBooked && styles.horaBooked,
                (isPendiente || isMiPendiente) && styles.horaPendiente,
                isSelected && styles.horaSelected,
              ]}
            >
              {slot.hora}
            </Text>
            <Text
              style={[
                styles.precio,
                isBooked && styles.precioBooked,
                isPendiente && styles.precioPendiente,
                isMiPendiente && styles.precioMiPendiente,
                isSelected && styles.precioSelected,
              ]}
            >
              {isBooked ? 'No disponible' : isPendiente ? 'En proceso de pago' : isMiPendiente ? 'Toca para continuar pago' : `S/${slot.precio}/hora`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    width: '47%',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1.5,
    borderColor: colors.gray200,
  },
  slotBooked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    opacity: 0.8,
  },
  slotPendiente: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    opacity: 0.85,
  },
  slotMiPendiente: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  bookedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  pendienteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  miPendienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  miPendienteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  slotSelected: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenPrimary,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.greenPrimary,
    marginBottom: 4,
  },
  hora: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 2,
  },
  horaBooked: {
    color: colors.gray400,
    fontSize: 14,
  },
  horaPendiente: {
    color: '#92400E',
    fontSize: 14,
  },
  horaSelected: {
    color: colors.greenPrimary,
  },
  precio: {
    fontSize: 13,
    color: colors.gray500,
  },
  precioBooked: {
    color: colors.gray400,
  },
  precioPendiente: {
    color: '#B45309',
  },
  precioMiPendiente: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 11,
  },
  precioSelected: {
    color: colors.greenPrimary,
    fontWeight: '600',
  },
});
