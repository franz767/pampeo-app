import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import RoleCard from '../../src/components/ui/RoleCard';
import { colors } from '../../src/theme';

// Placeholder images - se pueden reemplazar por imágenes reales después
const playerImage = { uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80' };
const fieldImage = { uri: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800&q=80' };

type Role = 'jugador' | 'dueno' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>(null);

  const handleContinue = () => {
    if (selectedRole === 'jugador') {
      router.push('/(auth)/register-player');
    } else if (selectedRole === 'dueno') {
      router.push('/(auth)/register-owner');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pampeo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenido al campo.</Text>
        <Text style={styles.subtitle}>Elige tu rol para comenzar.</Text>

        <View style={styles.cardsContainer}>
          <RoleCard
            title="⚽ Soy Jugador"
            description="Únete a partidos locales, registra tus stats y encuentra equipos cerca de ti."
            imageSource={playerImage}
            selected={selectedRole === 'jugador'}
            onPress={() => setSelectedRole('jugador')}
          />
          <RoleCard
            title="🏟️ Soy Dueño de Cancha"
            description="Publica tus canchas, gestiona reservas en tiempo real y haz crecer tu comunidad."
            imageSource={fieldImage}
            selected={selectedRole === 'dueno'}
            onPress={() => setSelectedRole('dueno')}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.continueButtonText}>Continuar</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.gray700,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray500,
    marginBottom: 32,
  },
  cardsContainer: {
    flex: 1,
  },
  continueButton: {
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
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
    fontWeight: '600',
    color: colors.greenPrimary,
  },
});
