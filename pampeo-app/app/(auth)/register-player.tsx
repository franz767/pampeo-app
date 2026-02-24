import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import AvatarPicker from '../../src/components/ui/AvatarPicker';
import PositionSelector from '../../src/components/ui/PositionSelector';
import { colors } from '../../src/theme';

import { Position } from '../../src/components/ui/PositionSelector';

export default function RegisterPlayerScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [apodo, setApodo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posiciones, setPosiciones] = useState<Position[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre completo');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa tu email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithEmail(email, password, nombre.trim(), 'jugador', {
        apodo: apodo.trim() || undefined,
        posicion: posiciones.length > 0 ? posiciones.join(',') : undefined,
        telefono: telefono.trim() || undefined,
      });

      // Si Supabase creó la sesión directamente (sin confirmación de email)
      if (result.session) {
        router.replace('/(tabs)/perfil');
      } else {
        Alert.alert(
          'Cuenta creada',
          'Revisa tu email para confirmar tu cuenta.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrarse como Jugador</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <AvatarPicker
          imageUri={avatarUri}
          onImageSelected={setAvatarUri}
          disabled={loading}
        />

        {/* Nombre Completo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre completo"
            placeholderTextColor={colors.gray400}
            value={nombre}
            onChangeText={setNombre}
            editable={!loading}
          />
        </View>

        {/* Apodo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apodo</Text>
          <TextInput
            style={styles.input}
            placeholder='Ej: La Muralla'
            placeholderTextColor={colors.gray400}
            value={apodo}
            onChangeText={setApodo}
            editable={!loading}
          />
        </View>

        {/* Teléfono */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número de Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="+51 999 888 777"
            placeholderTextColor={colors.gray400}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor={colors.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.gray400}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Posición Preferida */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Posiciones (puedes elegir varias)</Text>
          <PositionSelector
            selected={posiciones}
            onSelect={setPosiciones}
            disabled={loading}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.continueButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray900,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  continueButton: {
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
