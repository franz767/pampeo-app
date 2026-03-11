import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';

export default function VerificacionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    canchaName: string;
    fecha: string;
    hora: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.centerContent}>
        {/* Ícono animado */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] },
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={48} color={colors.yellow} />
          </View>
        </Animated.View>

        {/* Texto principal */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Reserva en proceso{'\n'}de verificación</Text>
          <Text style={styles.subtitle}>
            El dueño verificará tu pago y confirmará tu reserva
          </Text>

          {/* Detalles */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="football-outline" size={18} color={colors.greenPrimary} />
              <Text style={styles.detailText}>{params.canchaName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.greenPrimary} />
              <Text style={styles.detailText}>{params.fecha}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={colors.greenPrimary} />
              <Text style={styles.detailText}>{params.hora}</Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            Te notificaremos cuando el dueño confirme tu reserva
          </Text>
        </Animated.View>
      </View>

      {/* Botones */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/mis-partidos')}
        >
          <Ionicons name="list-outline" size={20} color={colors.white} />
          <Text style={styles.primaryBtnText}>Ver mis reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 14,
    padding: 18,
    gap: 12,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 13,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray400,
  },
});
