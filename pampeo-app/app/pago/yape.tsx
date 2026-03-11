import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme';
import { storageService } from '../../src/services/storage.service';
import { partidosService } from '../../src/services/partidos.service';
import { useAuth } from '../../src/hooks/useAuth';

export default function YapeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfil } = useAuth();
  const params = useLocalSearchParams<{
    reservaId: string;
    monto: string;
    canchaName: string;
    fecha: string;
    hora: string;
    numeroYape: string;
    nombreYape: string;
    duenoTelefono: string;
    duenoPerfilId: string;
    formato: string;
  }>();

  const numeroYape = params.numeroYape || '999 999 999';

  const [copiado, setCopiado] = useState(false);
  const [comprobanteUri, setComprobanteUri] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleCopiarNumero = async () => {
    await Clipboard.setStringAsync(numeroYape.replace(/\s/g, ''));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleAbrirYape = async () => {
    const yapeUrl = 'yape://';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bcp.innovacxion.yapeapp';
    const appStoreUrl = 'https://apps.apple.com/pe/app/yape/id1190917741';

    try {
      const canOpen = await Linking.canOpenURL(yapeUrl);
      if (canOpen) {
        await Linking.openURL(yapeUrl);
      } else {
        await Linking.openURL(Platform.OS === 'ios' ? appStoreUrl : playStoreUrl);
      }
    } catch {
      await Linking.openURL(Platform.OS === 'ios' ? appStoreUrl : playStoreUrl);
    }
  };

  const handleSeleccionarImagen = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tu galería para subir el comprobante');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setComprobanteUri(result.assets[0].uri);
    }
  };

  const handleTomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos', 'Necesitamos acceso a tu cámara para tomar foto del comprobante');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setComprobanteUri(result.assets[0].uri);
    }
  };

  const handleEnviarComprobante = async () => {
    if (!comprobanteUri || !params.reservaId) return;

    setEnviando(true);
    try {
      const url = await storageService.uploadComprobante(params.reservaId, comprobanteUri);
      await partidosService.subirComprobanteYape(params.reservaId, url);

      // Crear notificación para el dueño
      if (params.duenoPerfilId) {
        await partidosService.crearNotificacion(
          params.duenoPerfilId,
          'Nueva reserva por confirmar',
          `${perfil?.nombre_completo || 'Un jugador'} quiere reservar ${params.canchaName} · ${params.fecha} ${params.hora}. Monto: S/${params.monto}. Revisa tu Yape.`,
          'pago'
        );
      }

      // Abrir WhatsApp al dueño
      if (params.duenoTelefono) {
        const tel = params.duenoTelefono.replace(/\s/g, '');
        const msg = encodeURIComponent(
          `🏟️ PAMPEO — Nueva reserva por confirmar\n` +
          `Jugador: ${perfil?.nombre_completo || 'Jugador'}\n` +
          `Cancha: ${params.canchaName}\n` +
          `Fecha: ${params.fecha} · ${params.hora}\n` +
          `Formato: ${params.formato || '5v5'}\n` +
          `Monto: S/${params.monto}\n` +
          `Revisa tu Yape y confirma en la app de Pampeo.`
        );
        const waUrl = `https://wa.me/51${tel}?text=${msg}`;
        Linking.openURL(waUrl).catch(() => {});
      }

      router.replace({
        pathname: '/pago/verificacion',
        params: {
          canchaName: params.canchaName,
          fecha: params.fecha,
          hora: params.hora,
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el comprobante');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago con Yape</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Monto */}
        <View style={styles.montoCard}>
          <Text style={styles.montoLabel}>Total a pagar</Text>
          <Text style={styles.montoValue}>S/ {params.monto}</Text>
          <Text style={styles.montoSub}>{params.canchaName}</Text>
          <Text style={styles.montoSub}>{params.fecha} - {params.hora}</Text>
        </View>

        {/* Pasos */}
        <View style={styles.stepsContainer}>
          {/* Paso 1: Copiar número */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Copia el número de Yape</Text>
              {params.nombreYape && (
                <Text style={styles.yapeName}>Yapea a: {params.nombreYape}</Text>
              )}
              <TouchableOpacity style={styles.copyRow} onPress={handleCopiarNumero}>
                <Text style={styles.yapeNumber}>{numeroYape}</Text>
                <View style={[styles.copyBtn, copiado && styles.copyBtnDone]}>
                  <Ionicons
                    name={copiado ? 'checkmark' : 'copy-outline'}
                    size={18}
                    color={copiado ? colors.white : colors.greenPrimary}
                  />
                  <Text style={[styles.copyBtnText, copiado && styles.copyBtnTextDone]}>
                    {copiado ? 'Copiado' : 'Copiar'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Paso 2: Abrir Yape */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Realiza el pago en Yape</Text>
              <TouchableOpacity style={styles.yapeBtn} onPress={handleAbrirYape}>
                <Text style={styles.yapeBtnEmoji}>💜</Text>
                <Text style={styles.yapeBtnText}>Abrir Yape</Text>
                <Ionicons name="open-outline" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Paso 3: Subir comprobante */}
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sube la captura del comprobante</Text>

              {comprobanteUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: comprobanteUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setComprobanteUri(null)}
                  >
                    <Ionicons name="close-circle" size={28} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadBtns}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handleSeleccionarImagen}>
                    <Ionicons name="images-outline" size={24} color={colors.greenPrimary} />
                    <Text style={styles.uploadBtnText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handleTomarFoto}>
                    <Ionicons name="camera-outline" size={24} color={colors.greenPrimary} />
                    <Text style={styles.uploadBtnText}>Cámara</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón enviar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.sendBtn, !comprobanteUri && styles.sendBtnDisabled]}
          onPress={handleEnviarComprobante}
          disabled={!comprobanteUri || enviando}
        >
          {enviando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.white} />
              <Text style={styles.sendBtnText}>Enviar comprobante</Text>
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  montoCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  montoLabel: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 4,
  },
  montoValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.greenPrimary,
    marginBottom: 8,
  },
  montoSub: {
    fontSize: 13,
    color: colors.gray400,
    marginTop: 2,
  },
  stepsContainer: {
    gap: 24,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 12,
  },
  yapeName: {
    fontSize: 13,
    color: colors.greenBright,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: -4,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  yapeNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    flex: 1,
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyBtnDone: {
    backgroundColor: colors.greenPrimary,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  copyBtnTextDone: {
    color: colors.white,
  },
  yapeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6C2EB9',
    borderRadius: 12,
    paddingVertical: 14,
  },
  yapeBtnEmoji: {
    fontSize: 18,
  },
  yapeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  uploadBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'contain',
    backgroundColor: colors.darkCard,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.darkBg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.greenPrimary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});
