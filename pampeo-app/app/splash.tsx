import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { colors } from '../src/theme';

const LOADING_MESSAGES = [
  'Inflando el balón...',
  'Armando los arcos...',
  'Reuniendo al equipo...',
];

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, initialized, perfil } = useAuth();
  const [messageIndex, setMessageIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(0.8)).current;
  const ringRotation = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(ballScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotación continua del anillo
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(ringRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, []);

  // Barra de progreso
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  // Rotar mensajes
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Navegar cuando esté listo
  useEffect(() => {
    if (!initialized) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/role-selection');
      } else if (perfil?.rol === 'dueno') {
        router.replace('/(owner)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    }, 3200);

    return () => clearTimeout(timer);
  }, [initialized, isAuthenticated, perfil]);

  const spin = ringRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const progressPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.centerContent, { opacity: fadeIn }]}>
        {/* Círculos concéntricos */}
        <View style={styles.circlesContainer}>
          <View style={[styles.ring, styles.ring3]} />
          <View style={[styles.ring, styles.ring2]} />
          <Animated.View
            style={[
              styles.ring,
              styles.ring1,
              { transform: [{ rotate: spin }] },
            ]}
          />
          {/* Balón */}
          <Animated.View
            style={[styles.ballContainer, { transform: [{ scale: ballScale }] }]}
          >
            <Text style={styles.ballEmoji}>⚽</Text>
          </Animated.View>
        </View>

        {/* Texto de carga */}
        <Text style={styles.mainText}>{LOADING_MESSAGES[messageIndex]}</Text>
        <Text style={styles.subText}>Preparando todo para ti...</Text>

        {/* Barra de progreso */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>REUNIENDO AL EQUIPO</Text>
            <ProgressPercent value={progressPercent} />
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressWidth }]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Logo PAMPEO */}
      <Animated.View style={[styles.logoContainer, { opacity: fadeIn }]}>
        <Text style={styles.logoIcon}>⚽</Text>
        <Text style={styles.logoText}>PAMPEO</Text>
      </Animated.View>
    </View>
  );
}

function ProgressPercent({ value }: { value: Animated.AnimatedInterpolation<number> }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const listener = value.addListener(({ value: v }) => {
      setPercent(Math.round(v));
    });
    return () => value.removeListener(listener);
  }, [value]);

  return <Text style={styles.progressPercent}>{percent}%</Text>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  centerContent: {
    alignItems: 'center',
  },
  circlesContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },
  ring3: {
    width: 220,
    height: 220,
    borderColor: 'rgba(34, 197, 94, 0.08)',
  },
  ring2: {
    width: 180,
    height: 180,
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  ring1: {
    width: 140,
    height: 140,
    borderColor: colors.greenPrimary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  ballContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballEmoji: {
    fontSize: 50,
  },
  mainText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 40,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
    letterSpacing: 1.5,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.greenPrimary,
    borderRadius: 3,
  },
  logoContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
  },
});
