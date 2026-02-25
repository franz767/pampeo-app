import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

export interface TimeSlot {
  hora: string;
  precio: number;
  estado: 'disponible' | 'ocupado' | 'seleccionado';
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSlotSelect: (hora: string) => void;
}

export default function TimeSlotGrid({ slots, selectedSlot, onSlotSelect }: TimeSlotGridProps) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.hora;
        const isBooked = slot.estado === 'ocupado';

        return (
          <TouchableOpacity
            key={slot.hora}
            style={[
              styles.slot,
              isBooked && styles.slotBooked,
              isSelected && styles.slotSelected,
            ]}
            onPress={() => !isBooked && onSlotSelect(slot.hora)}
            disabled={isBooked}
            activeOpacity={0.7}
          >
            {isSelected && <Text style={styles.selectedLabel}>ELEGIDO</Text>}
            {isBooked && <Text style={styles.bookedLabel}>RESERVADO</Text>}
            <Text
              style={[
                styles.hora,
                isBooked && styles.horaBooked,
                isSelected && styles.horaSelected,
              ]}
            >
              {slot.hora}
            </Text>
            <Text
              style={[
                styles.precio,
                isBooked && styles.precioBooked,
                isSelected && styles.precioSelected,
              ]}
            >
              {isBooked ? 'No disponible' : `S/${slot.precio}/hora`}
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
  bookedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
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
  precioSelected: {
    color: colors.greenPrimary,
    fontWeight: '600',
  },
});
