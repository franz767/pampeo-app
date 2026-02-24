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
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/hooks/useAuth';
import MapPicker from '../../src/components/MapPicker';
import { colors } from '../../src/theme';

const PENDING_SEDE_KEY = 'pendingSedeData';

const DEFAULT_LOCATION = {
  latitude: -11.775,
  longitude: -75.4972,
};

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function RegisterOwnerScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);

  // Datos personales
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Datos de la cancha
  const [nombreSede, setNombreSede] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [numCanchas, setNumCanchas] = useState(1);
  const [precioHora, setPrecioHora] = useState('');
  const [tipoSuperficie, setTipoSuperficie] = useState<'grass_natural' | 'grass_sintetico'>('grass_sintetico');
  const [fotos, setFotos] = useState<string[]>([]);

  // Map modal
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [tempMarker, setTempMarker] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const openMapPicker = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setTempMarker({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } else {
        setTempMarker(DEFAULT_LOCATION);
      }
    } catch {
      setTempMarker(location || DEFAULT_LOCATION);
    }
    setLoadingLocation(false);
    setMapModalVisible(true);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTempMarker({ latitude, longitude });
  };

  const confirmLocation = async () => {
    if (!tempMarker) return;
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: tempMarker.latitude,
        longitude: tempMarker.longitude,
      });
      const addressString = address
        ? `${address.street || ''} ${address.streetNumber || ''}, ${address.district || address.city || ''}`
        : `${tempMarker.latitude.toFixed(6)}, ${tempMarker.longitude.toFixed(6)}`;
      setLocation({ ...tempMarker, address: addressString.trim() });
    } catch {
      setLocation({
        ...tempMarker,
        address: `${tempMarker.latitude.toFixed(6)}, ${tempMarker.longitude.toFixed(6)}`,
      });
    }
    setMapModalVisible(false);
  };

  const pickImage = async () => {
    if (fotos.length >= 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 fotos permitidas');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFotos([...fotos, result.assets[0].uri]);
    }
  };

  const handleRegister = async () => {
    // Validar datos personales
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa tu nombre completo'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Ingresa tu email'); return; }
    if (password.length < 6) { Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres'); return; }
    // Validar datos de cancha
    if (!nombreSede.trim()) { Alert.alert('Error', 'Ingresa el nombre de tu cancha'); return; }
    if (!location) { Alert.alert('Error', 'Selecciona la ubicación de tu cancha en el mapa'); return; }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, nombre.trim(), 'dueno', {
        telefono: telefono.trim() || undefined,
      });

      // Guardar datos de sede/cancha en AsyncStorage para crear en primer login
      const pendingData = {
        sede: {
          nombre: nombreSede.trim(),
          direccion: location.address || `${location.latitude}, ${location.longitude}`,
          latitud: location.latitude,
          longitud: location.longitude,
          telefono_contacto: telefono.trim() || undefined,
        },
        canchas: Array.from({ length: numCanchas }, (_, i) => ({
          nombre: numCanchas === 1 ? 'Cancha 1' : `Cancha ${i + 1}`,
          tipo_superficie: tipoSuperficie,
          capacidad: '5v5_6v6' as const,
          precio_hora: parseFloat(precioHora) || 0,
          foto_uri: fotos[0] || undefined,
        })),
      };
      await AsyncStorage.setItem(PENDING_SEDE_KEY, JSON.stringify(pendingData));

      Alert.alert(
        'Cuenta creada',
        'Revisa tu email para confirmar tu cuenta. Una vez confirmada podrás acceder a tu panel y gestionar tu cancha.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
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
        <Text style={styles.headerTitle}>Registrar Sede</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ===== DATOS DE LA CANCHA ===== */}

        {/* Nombre de la Sede */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de la Sede</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Complejo Santiago Bernabéu"
            placeholderTextColor={colors.gray400}
            value={nombreSede}
            onChangeText={setNombreSede}
            editable={!loading}
          />
        </View>

        {/* Ubicación */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ubicación</Text>
          <TouchableOpacity
            style={styles.locationInput}
            onPress={openMapPicker}
            disabled={loading || loadingLocation}
          >
            {loadingLocation ? (
              <ActivityIndicator color={colors.greenPrimary} />
            ) : location ? (
              <View style={styles.locationSelected}>
                <Text style={styles.locationText} numberOfLines={1}>{location.address}</Text>
                <Ionicons name="location" size={22} color={colors.greenPrimary} />
              </View>
            ) : (
              <View style={styles.locationSelected}>
                <Text style={styles.locationPlaceholder}>Calle, Ciudad, Código Postal</Text>
                <Ionicons name="location" size={22} color={colors.greenPrimary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Map Preview */}
          <TouchableOpacity style={styles.mapPreview} onPress={openMapPicker} disabled={loading}>
            <Image
              source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${location?.latitude || DEFAULT_LOCATION.latitude},${location?.longitude || DEFAULT_LOCATION.longitude}&zoom=14&size=600x200&maptype=roadmap&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}` }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={20} color={colors.greenPrimary} />
              <Text style={styles.mapOverlayText}>Toca para seleccionar en el mapa</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Number of Fields + Price */}
        <View style={styles.rowGroup}>
          <View style={styles.halfGroup}>
            <Text style={styles.label}>Número de Canchas</Text>
            <View style={styles.counterContainer}>
              <TouchableOpacity
                style={[styles.counterButton, numCanchas <= 1 && styles.counterButtonDisabled]}
                onPress={() => numCanchas > 1 && setNumCanchas(numCanchas - 1)}
                disabled={numCanchas <= 1 || loading}
              >
                <Ionicons name="remove" size={22} color={numCanchas <= 1 ? colors.gray400 : colors.greenPrimary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{numCanchas}</Text>
              <TouchableOpacity
                style={[styles.counterButton, numCanchas >= 10 && styles.counterButtonDisabled]}
                onPress={() => numCanchas < 10 && setNumCanchas(numCanchas + 1)}
                disabled={numCanchas >= 10 || loading}
              >
                <Ionicons name="add" size={22} color={numCanchas >= 10 ? colors.gray400 : colors.greenPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.halfGroup}>
            <Text style={styles.label}>Precio por Hora</Text>
            <TextInput
              style={styles.input}
              placeholder="S/ 0.00"
              placeholderTextColor={colors.gray400}
              value={precioHora}
              onChangeText={setPrecioHora}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>

        {/* Tipo de Superficie */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de Superficie</Text>
          <View style={styles.surfaceOptions}>
            <TouchableOpacity
              style={[styles.surfaceOption, tipoSuperficie === 'grass_natural' && styles.surfaceOptionActive]}
              onPress={() => setTipoSuperficie('grass_natural')}
              disabled={loading}
            >
              <Text style={[styles.surfaceText, tipoSuperficie === 'grass_natural' && styles.surfaceTextActive]}>
                Natural
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.surfaceOption, tipoSuperficie === 'grass_sintetico' && styles.surfaceOptionActive]}
              onPress={() => setTipoSuperficie('grass_sintetico')}
              disabled={loading}
            >
              <Text style={[styles.surfaceText, tipoSuperficie === 'grass_sintetico' && styles.surfaceTextActive]}>
                Sintético
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fotos */}
        <View style={styles.inputGroup}>
          <View style={styles.photosHeader}>
            <Text style={styles.label}>Fotos del Local</Text>
            <Text style={styles.photosLimit}>Máx 5 fotos</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage} disabled={loading}>
              <Ionicons name="camera-outline" size={28} color={colors.greenPrimary} />
              <Text style={styles.addPhotoText}>Agregar</Text>
            </TouchableOpacity>
            {fotos.map((foto, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: foto }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => setFotos(fotos.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={22} color={colors.red} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* ===== DATOS PERSONALES ===== */}
        <Text style={styles.sectionTitle}>Datos de tu cuenta</Text>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono de contacto</Text>
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
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.gray400}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.registerButtonText}>Registrar Sede</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Map Modal */}
      <Modal visible={mapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Selecciona la ubicación</Text>
            <TouchableOpacity onPress={confirmLocation} disabled={!tempMarker}>
              <Text style={[styles.confirmText, !tempMarker && { color: colors.gray200 }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapInstructions}>
            <Ionicons name="finger-print" size={18} color={colors.gray500} />
            <Text style={styles.instructionsText}>Toca en el mapa para marcar la ubicación de tu cancha</Text>
          </View>

          <MapPicker
            tempMarker={tempMarker}
            defaultLocation={DEFAULT_LOCATION}
            onMapPress={handleMapPress}
            onMarkerDragEnd={(coord) => setTempMarker(coord)}
          />

          {tempMarker && (
            <View style={styles.coordsDisplay}>
              <Text style={styles.coordsText}>
                {tempMarker.latitude.toFixed(6)}, {tempMarker.longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 20,
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
  // Location
  locationInput: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  locationSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 15,
    color: colors.gray900,
    flex: 1,
    marginRight: 8,
  },
  locationPlaceholder: {
    fontSize: 15,
    color: colors.gray400,
  },
  mapPreview: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 10,
  },
  mapOverlayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  // Counter & Price row
  rowGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  halfGroup: {
    flex: 1,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: colors.gray100,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  // Surface
  surfaceOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  surfaceOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
  },
  surfaceOptionActive: {
    backgroundColor: colors.greenPrimary,
    borderColor: colors.greenPrimary,
  },
  surfaceText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray500,
  },
  surfaceTextActive: {
    color: colors.white,
  },
  // Photos
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photosLimit: {
    fontSize: 12,
    color: colors.gray400,
  },
  addPhotoButton: {
    width: 90,
    height: 90,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.greenPrimary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.greenPrimary,
    marginTop: 4,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 10,
    marginTop: 8,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.white,
    borderRadius: 11,
  },
  // Password
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
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  registerButton: {
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  // Map Modal
  mapModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  mapInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.gray50,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.gray500,
  },
  coordsDisplay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coordsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
  },
});
