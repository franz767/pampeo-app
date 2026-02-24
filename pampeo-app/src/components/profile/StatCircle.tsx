import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface StatCircleProps {
  value: number;
  label: string;
  icon?: string;
}

export default function StatCircle({ value, label, icon }: StatCircleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <View style={styles.valueRow}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[styles.value, { color: colors.greenPrimary }]}>{value}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 16,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
