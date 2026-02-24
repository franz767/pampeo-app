import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

interface BookingFooterProps {
  total: number;
  disabled: boolean;
  onBook: () => void;
  label?: string;
  priceLabel?: string;
  buttonText?: string;
}

export default function BookingFooter({
  total,
  disabled,
  onBook,
  priceLabel = 'POR JUGADOR',
  buttonText = 'Unirme',
}: BookingFooterProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.chatButton}>
        <Ionicons name="chatbubble-outline" size={22} color={colors.gray700} />
      </TouchableOpacity>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>{priceLabel}</Text>
        <Text style={styles.totalValue}>S/{total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.bookButton, disabled && styles.bookButtonDisabled]}
        onPress={onBook}
        disabled={disabled}
      >
        <Text style={styles.bookButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    gap: 14,
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray400,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
  },
  bookButton: {
    backgroundColor: colors.greenPrimary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookButtonDisabled: {
    opacity: 0.4,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
