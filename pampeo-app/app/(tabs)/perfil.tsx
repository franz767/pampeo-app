import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import StatCircle from '../../src/components/profile/StatCircle';
import PlayerDNA from '../../src/components/profile/PlayerDNA';
import MatchHistoryCard from '../../src/components/profile/MatchHistoryCard';
import { colors } from '../../src/theme';

const NIVEL_MAP: Record<string, string> = {
  principiante: 'PRINCIPIANTE',
  intermedio: 'INTERMEDIO',
  avanzado: 'AVANZADO',
};

// Datos de ejemplo para últimos partidos (se reemplazarán con datos reales)
const SAMPLE_MATCHES = [
  { opponent: 'Turbos FC', date: 'Oct 24', venue: 'Cancha 3', result: 'win' as const, score: '3 - 1' },
  { opponent: 'Liga Dominical', date: 'Oct 18', venue: 'Cancha 1', result: 'loss' as const, score: '2 - 4' },
  { opponent: 'Night Owls', date: 'Oct 12', venue: 'Cancha 2', result: 'win' as const, score: '5 - 2' },
];

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfil, jugador, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/role-selection');
            } catch (e) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const nivel = jugador?.nivel ? NIVEL_MAP[jugador.nivel] || jugador.nivel : 'AVANZADO';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.headerButton}>
          <Ionicons name="settings-outline" size={24} color={colors.gray900} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {perfil?.avatar_url ? (
              <Image source={{ uri: perfil.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={colors.gray400} />
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
          </View>
          <Text style={styles.name}>{perfil?.nombre_completo || 'Jugador'}</Text>
          <View style={styles.levelBadge}>
            <Ionicons name="diamond" size={14} color={colors.greenPrimary} />
            <Text style={styles.levelText}>{nivel}</Text>
          </View>
        </View>

        {/* Billetera Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={20} color={colors.greenPrimary} />
            </View>
            <Text style={styles.walletLabel}>Mi Billetera</Text>
          </View>
          <Text style={styles.walletAmount}>S/{(jugador?.saldo || 0).toFixed(2)}</Text>
          <TouchableOpacity style={styles.walletBtn} disabled>
            <Ionicons name="add-circle-outline" size={16} color={colors.gray400} />
            <Text style={styles.walletBtnText}>Recargar (Próximamente)</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatCircle value={jugador?.goles || 42} label="GOLES" />
            <StatCircle value={jugador?.partidos_ganados || 18} label="GANADOS" />
            <StatCircle value={0} label="MVPS" icon="🏆" />
          </View>
        </View>

        {/* Player DNA */}
        <PlayerDNA
          posicion={jugador?.posicion || 'delantero'}
          zonaPreferida={jugador?.zona_preferida || 'Diestro'}
          onEdit={() => {}}
        />

        {/* Last Matches */}
        <View style={styles.matchesSection}>
          <View style={styles.matchesHeader}>
            <Text style={styles.matchesTitle}>Últimos Partidos</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Ver Todo</Text>
            </TouchableOpacity>
          </View>
          {SAMPLE_MATCHES.map((match, index) => (
            <MatchHistoryCard key={index} {...match} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  headerButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.greenBorder,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.greenBorder,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.greenPrimary,
    letterSpacing: 0.5,
  },
  // Wallet
  walletCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.gray900,
    marginBottom: 12,
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gray100,
    paddingVertical: 10,
    borderRadius: 10,
  },
  walletBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray400,
  },
  // Stats
  statsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  // Matches
  matchesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray400,
  },
});