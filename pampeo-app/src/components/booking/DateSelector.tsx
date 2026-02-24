import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

function getNextDays(count: number) {
  const days: { key: string; label: string; subLabel: string }[] = [];
  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    const dayNum = date.getDate();

    if (i === 0) {
      days.push({ key, label: 'Hoy', subLabel: String(dayNum) });
    } else {
      days.push({
        key,
        label: dayNames[date.getDay()],
        subLabel: String(dayNum),
      });
    }
  }
  return days;
}

export default function DateSelector({ selectedDate, onDateSelect }: DateSelectorProps) {
  const days = getNextDays(7);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const isSelected = selectedDate === day.key;
        return (
          <TouchableOpacity
            key={day.key}
            style={[styles.dayChip, isSelected && styles.dayChipSelected]}
            onPress={() => onDateSelect(day.key)}
          >
            <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
              {day.label}
            </Text>
            <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
              {day.subLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 4,
  },
  dayChip: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    minWidth: 64,
  },
  dayChipSelected: {
    backgroundColor: colors.greenPrimary,
    borderColor: colors.greenPrimary,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: colors.white,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray900,
  },
  dayNumberSelected: {
    color: colors.white,
  },
});
