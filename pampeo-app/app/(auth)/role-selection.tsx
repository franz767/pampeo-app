import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import RoleCard from '../../src/components/ui/RoleCard';
import { colors } from '../../src/theme';

const playerImage = { uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80' };
const fieldImage = { uri: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80' };

type Role = 'jugador' | 'dueno' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  // Animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(30)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  // Brand logo animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;
  const dotGlow = useRef(new Animated.Value(0.3)).current;
  const logoShimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance - bouncy scale-in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous dot pulse - breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dotPulse, {
            toValue: 1.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotGlow, {
            toValue: 0.8,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dotPulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotGlow, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    // Shimmer effect on brand text
    Animated.loop(
      Animated.timing(logoShimmer, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Content stagger entrance
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(card1Opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(card1TranslateY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card2Opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(card2TranslateY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.timing(bottomOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (selectedRole === 'jugador') {
      router.push('/(auth)/register-player');
    } else if (selectedRole === 'dueno') {
      router.push('/(auth)/register-owner');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={22} color={colors.gray700} />
        </TouchableOpacity>

        {/* Premium Brand Logo */}
        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0F2A14', '#1A3A1F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandPill}
          >
            {/* Animated Dot with glow */}
            <View style={styles.dotWrapper}>
              <Animated.View
                style={[
                  styles.dotGlow,
                  {
                    opacity: dotGlow,
                    transform: [{ scale: dotPulse }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.logoDot,
                  { transform: [{ scale: dotPulse }] },
                ]}
              />
            </View>

            {/* Brand Name with gradient */}
            <MaskedView
              maskElement={
                <Text style={styles.brandText}>Pampeo</Text>
              }
            >
              <LinearGradient
                colors={['#22C55E', '#4ADE80', '#86EFAC', '#4ADE80', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.brandText, { opacity: 0 }]}>Pampeo</Text>
              </LinearGradient>
            </MaskedView>
          </LinearGradient>
        </Animated.View>

        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated gradient title */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }}>
          <MaskedView
            maskElement={
              <Text style={styles.titleMask}>Bienvenido{'\n'}al campo.</Text>
            }
          >
            <LinearGradient
              colors={['#0F2A14', '#166534', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.titleMask, { opacity: 0 }]}>Bienvenido{'\n'}al campo.</Text>
            </LinearGradient>
          </MaskedView>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Elige tu rol para comenzar.
        </Animated.Text>

        <View style={styles.cardsContainer}>
          <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }] }}>
            <RoleCard
              title="Soy Jugador"
              description="Únete a partidos locales, registra tus stats y encuentra equipos cerca de ti."
              imageSource={playerImage}
              selected={selectedRole === 'jugador'}
              onPress={() => setSelectedRole('jugador')}
              icon="football"
            />
          </Animated.View>
          <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }] }}>
            <RoleCard
              title="Soy Dueño de Cancha"
              description="Publica tus canchas, gestiona reservas en tiempo real y haz crecer tu comunidad."
              imageSource={fieldImage}
              selected={selectedRole === 'dueno'}
              onPress={() => setSelectedRole('dueno')}
              icon="business"
            />
          </Animated.View>
        </View>

        {/* Continue Button */}
        <Animated.View style={{ opacity: bottomOpacity }}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={!selectedRole}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedRole ? ['#0F2A14', '#22C55E'] : [colors.gray200, colors.gray200]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Text style={[styles.continueButtonText, !selectedRole && styles.continueTextDisabled]}>
                Continuar
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={selectedRole ? colors.white : colors.gray400}
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  dotWrapper: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  titleMask: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 42,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    marginBottom: 24,
  },
  cardsContainer: {
    flex: 1,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  continueTextDisabled: {
    color: colors.gray400,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  loginText: {
    fontSize: 14,
    color: colors.gray500,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
});
