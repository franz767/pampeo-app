import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export type Position = 'arquero' | 'defensa' | 'mediocampista' | 'delantero';

interface PositionOption {
  key: Position;
  label: string;
  icon: string;
}

const POSITIONS: PositionOption[] = [
  { key: 'arquero', label: 'ARQ', icon: 'hand-left-outline' },
  { key: 'defensa', label: 'DEF', icon: 'shield-outline' },
  { key: 'mediocampista', label: 'MED', icon: 'grid-outline' },
  { key: 'delantero', label: 'DEL', icon: 'flash-outline' },
];

interface PositionSelectorProps {
  selected: Position[];
  onSelect: (positions: Position[]) => void;
  disabled?: boolean;
}

export default function PositionSelector({ selected, onSelect, disabled }: PositionSelectorProps) {
  const togglePosition = (pos: Position) => {
    if (selected.includes(pos)) {
      onSelect(selected.filter((p) => p !== pos));
    } else {
      onSelect([...selected, pos]);
    }
  };

  return (
    <View style={styles.container}>
      {POSITIONS.map((pos) => {
        const isSelected = selected.includes(pos.key);
        return (
          <TouchableOpacity
            key={pos.key}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => togglePosition(pos.key)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons
              name={pos.icon}
              size={24}
              color={isSelected ? colors.white : colors.gray500}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {pos.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    gap: 6,
  },
  optionSelected: {
    backgroundColor: colors.greenPrimary,
    borderColor: colors.greenPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray500,
  },
  labelSelected: {
    color: colors.white,
  },
});