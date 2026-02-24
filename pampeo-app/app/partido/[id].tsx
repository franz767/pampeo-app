import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePartido } from '../../src/hooks/usePartido';
import { useAuth } from '../../src/hooks/useAuth';
import { JugadorPartidoConPerfil } from '../../src/services/partidos.service';
import { colors } from '../../src/theme';

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFechaLarga(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return `${diasSemana[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

function formatHora(hora: string): string {
  return hora.substring(0, 5);
}

const estadoConfig: Record<string, { label: string; bg: string; text: string }> = {
  abierto: { label: 'Abierto', bg: colors.greenLight, text: colors.greenPrimary },
  lleno: { label: 'Lleno', bg: '#FEF3C7', text: '#D97706' },
  en_curso: { label: 'En curso', bg: '#DBEAFE', text: '#2563EB' },
  finalizado: { label: 'Finalizado', bg: colors.gray100, text: colors.gray500 },
  cancelado: { label: 'Cancelado', bg: '#FEE2E2', text: colors.red },
};

export default function PartidoDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, jugador, refreshUserData } = useAuth();

  const {
    partido,
    loading,
    error,
    actionLoading,
    jugadoresConfirmados,
    estaUnido,
    esCreador,
    estaLleno,
    estaCancelado,
    unirse,
    salir,
    cancelar,
  } = usePartido(id || '', jugador?.id, user?.id);

  const handleUnirse = async () => {
    try {
      await unirse();
      await refreshUserData();
      // Verificar si el partido se llenó después de unirse
      const confirmados = (partido?.jugadores_confirmados || 0) + 1;
      if (confirmados >= (partido?.max_jugadores || 0)) {
        Alert.alert(
          'Partido Completo!',
          'Eres el último jugador! El partido está listo. Nos vemos en la cancha!',
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo unir al partido');
    }
  };

  const handleSalir = () => {
    Alert.alert(
      'Salir del Partido',
      `¿Estás seguro? Se te devolverá S/${partido?.precio_por_jugador || 0} a tu saldo.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await salir();
              await refreshUserData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo salir del partido');
            }
          },
        },
      ],
    );
  };

  const handleCancelar = () => {
    Alert.alert('Cancelar Partido', '¿Estás seguro? Se devolverá el saldo a todos los jugadores.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelar();
            await refreshUserData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo cancelar');
          }
        },
      },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Únete a mi partido de fútbol!\n${partido?.cancha?.sede?.nombre} - ${partido?.cancha?.nombre}\n${formatFechaLarga(partido?.fecha || '')} ${formatHora(partido?.hora_inicio || '')}\nFaltan ${(partido?.max_jugadores || 0) - (partido?.jugadores_confirmados || 0)} jugadores`,
      });
    } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
        <Text style={styles.loadingText}>Cargando partido...</Text>
      </View>
    );
  }

  if (error || !partido) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
        <Text style={styles.errorText}>{error || 'Partido no encontrado'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const estado = estadoConfig[partido.estado] || estadoConfig.abierto;
  const progreso = partido.max_jugadores > 0
    ? partido.jugadores_confirmados / partido.max_jugadores
    : 0;
  const slotsVacios = partido.max_jugadores - jugadoresConfirmados.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala de Partido</Text>
        <View style={styles.headerRight}>
          <View style={styles.saldoChip}>
            <Ionicons name="wallet-outline" size={14} color={colors.greenPrimary} />
            <Text style={styles.saldoChipText}>S/{(jugador?.saldo || 0).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={colors.gray900} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <Text style={styles.sedeName}>{partido.cancha?.sede?.nombre}</Text>
              <Text style={styles.canchaName}>{partido.cancha?.nombre}</Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
              <Text style={[styles.estadoText, { color: estado.text }]}>{estado.label}</Text>
            </View>
          </View>

          <View style={styles.infoDetails}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.greenPrimary} />
              <Text style={styles.infoText}>{formatFechaLarga(partido.fecha)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.greenPrimary} />
              <Text style={styles.infoText}>
                {formatHora(partido.hora_inicio)} - {formatHora(partido.hora_fin)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={colors.greenPrimary} />
              <Text style={styles.infoText} numberOfLines={1}>
                {partido.cancha?.sede?.direccion}
              </Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.formatoBadge}>
              <Ionicons name="football" size={14} color={colors.white} />
              <Text style={styles.formatoText}>{partido.formato}</Text>
            </View>
            <Text style={styles.precioTag}>S/{partido.precio_por_jugador} / jugador</Text>
          </View>
        </View>

        {/* Players Progress */}
        <View style={styles.section}>
          <View style={styles.playersHeader}>
            <Text style={styles.sectionTitle}>Jugadores</Text>
            <Text style={styles.playersCount}>
              {partido.jugadores_confirmados}/{partido.max_jugadores}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progreso * 100}%` }, estaLleno && { backgroundColor: '#D97706' }]} />
          </View>
        </View>

        {/* Partido Completo Banner */}
        {estaLleno && (
          <View style={styles.completeBanner}>
            <View style={styles.completeBannerIcon}>
              <Ionicons name="checkmark-circle" size={28} color={colors.white} />
            </View>
            <View style={styles.completeBannerContent}>
              <Text style={styles.completeBannerTitle}>Partido Completo!</Text>
              <Text style={styles.completeBannerSubtitle}>
                {estaUnido ? 'Nos vemos en la cancha!' : 'Este partido ya se llenó'}
              </Text>
            </View>
          </View>
        )}

        {/* Confirmed Players */}
        <View style={styles.section}>
          {jugadoresConfirmados.map((jp: JugadorPartidoConPerfil) => (
            <View key={jp.id} style={styles.playerRow}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerInitial}>
                  {(jp.jugador?.perfil?.nombre_completo || jp.jugador?.apodo || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerName}>
                    {jp.jugador?.perfil?.nombre_completo || jp.jugador?.apodo || 'Jugador'}
                  </Text>
                  {jp.jugador?.perfil_id === partido.creador_id && (
                    <View style={styles.creadorTag}>
                      <Ionicons name="star" size={10} color={colors.greenPrimary} />
                      <Text style={styles.creadorTagText}>Creador</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.playerPosition}>
                  {jp.jugador?.posicion || 'Sin posición'}
                </Text>
              </View>
            </View>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, slotsVacios) }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.playerRow}>
              <View style={styles.emptyAvatar}>
                <Ionicons name="person-add-outline" size={18} color={colors.gray400} />
              </View>
              <Text style={styles.emptyText}>Esperando jugador...</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Action */}
      {!estaCancelado && (
        <View style={styles.footer}>
          {!estaUnido && !estaLleno && (
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={handleUnirse}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={20} color={colors.white} />
                  <Text style={styles.joinBtnText}>Unirme al Partido</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {!estaUnido && estaLleno && (
            <View style={styles.fullBtn}>
              <Ionicons name="lock-closed" size={20} color={colors.gray400} />
              <Text style={styles.fullBtnText}>Partido Lleno</Text>
            </View>
          )}

          {estaUnido && !esCreador && (
            <View style={styles.footerRow}>
              {estaLleno && (
                <View style={styles.readyChip}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.greenPrimary} />
                  <Text style={styles.readyChipText}>Listo para jugar</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.leaveBtn, estaLleno && { flex: 0, paddingHorizontal: 20 }]}
                onPress={handleSalir}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.red} />
                ) : (
                  <>
                    <Ionicons name="exit-outline" size={20} color={colors.red} />
                    <Text style={styles.leaveBtnText}>Salir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {esCreador && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelar}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={colors.red} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color={colors.red} />
                  <Text style={styles.cancelBtnText}>Cancelar Partido</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {estaCancelado && (
        <View style={styles.footer}>
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={20} color={colors.red} />
            <Text style={styles.cancelledText}>Este partido fue cancelado</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.gray400,
    fontSize: 14,
  },
  errorText: {
    color: colors.gray500,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.greenPrimary,
    borderRadius: 10,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saldoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  saldoChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  scrollView: {
    flex: 1,
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  infoLeft: {
    flex: 1,
    marginRight: 8,
  },
  sedeName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.gray900,
  },
  canchaName: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoDetails: {
    gap: 8,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray700,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  formatoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  formatoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  precioTag: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.greenPrimary,
  },

  // Section
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },

  // Players progress
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playersCount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.greenPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.greenPrimary,
    borderRadius: 4,
  },

  // Player rows
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  playerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  creadorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creadorTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  playerPosition: {
    fontSize: 13,
    color: colors.gray400,
    marginTop: 2,
  },
  emptyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray400,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.greenPrimary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.red,
  },
  leaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    borderRadius: 14,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
  },
  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gray100,
    paddingVertical: 16,
    borderRadius: 14,
  },
  fullBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray400,
  },
  // Partido completo
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: colors.greenPrimary,
    borderRadius: 16,
    gap: 12,
  },
  completeBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBannerContent: {
    flex: 1,
  },
  completeBannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
  },
  completeBannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  readyChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red,
  },
});
