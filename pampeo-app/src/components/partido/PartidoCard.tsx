import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { PartidoConDetalles } from '../../services/partidos.service';
import { colors } from '../../theme';

interface PartidoCardProps {
  partido: PartidoConDetalles;
  onPress?: () => void;
  esCreador?: boolean;
}

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatFecha(fecha: string): string {
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

export function PartidoCard({ partido, onPress, esCreador }: PartidoCardProps) {
  const estado = estadoConfig[partido.estado] || estadoConfig.abierto;
  const progreso = partido.max_jugadores > 0
    ? partido.jugadores_confirmados / partido.max_jugadores
    : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sedeName} numberOfLines={1}>
            {partido.cancha?.sede?.nombre || 'Sede'}
          </Text>
          <Text style={styles.canchaName} numberOfLines={1}>
            {partido.cancha?.nombre}
          </Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
          <Text style={[styles.estadoText, { color: estado.text }]}>{estado.label}</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.gray500} />
          <Text style={styles.infoText}>{formatFecha(partido.fecha)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color={colors.gray500} />
          <Text style={styles.infoText}>
            {formatHora(partido.hora_inicio)} - {formatHora(partido.hora_fin)}
          </Text>
        </View>
        <View style={styles.formatoBadge}>
          <Text style={styles.formatoText}>{partido.formato}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabel}>
            <Ionicons name="people" size={14} color={colors.greenPrimary} />
            <Text style={styles.progressText}>
              {partido.jugadores_confirmados}/{partido.max_jugadores} jugadores
            </Text>
          </View>
          <Text style={styles.precioText}>S/{partido.precio_por_jugador}/jugador</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progreso * 100}%` }]} />
        </View>
      </View>

      {/* Creator badge */}
      {esCreador && (
        <View style={styles.creadorBadge}>
          <Ionicons name="star" size={12} color={colors.greenPrimary} />
          <Text style={styles.creadorText}>Creado por ti</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  sedeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  canchaName: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray700,
  },
  formatoBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  formatoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gray700,
  },
  progressSection: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  precioText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.greenPrimary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.greenPrimary,
    borderRadius: 3,
  },
  creadorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  creadorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.greenPrimary,
  },
});
