import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const firstName = perfil?.nombre_completo?.split(' ')[0] || 'Jugador';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Header with Avatar */}
        <LinearGradient
          colors={['#0F2A14', '#1A3A1F', '#22C55E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          {/* Top bar */}
          <View style={styles.headerTopBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
            <TouchableOpacity onPress={handleSignOut} style={styles.headerIconBtn}>
              <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Avatar + Name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {perfil?.avatar_url ? (
                <Image source={{ uri: perfil.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
            </View>
            <Text style={styles.name}>{perfil?.nombre_completo || 'Jugador'}</Text>
            <View style={styles.levelBadge}>
              <Ionicons name="diamond" size={12} color="#FCD34D" />
              <Text style={styles.levelText}>{nivel}</Text>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{jugador?.goles || 0}</Text>
              <Text style={styles.quickStatLabel}>Goles</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{jugador?.partidos_ganados || 0}</Text>
              <Text style={styles.quickStatLabel}>Ganados</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>0</Text>
              <Text style={styles.quickStatLabel}>MVPs</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Billetera Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIcon}>
                <Ionicons name="wallet" size={20} color={colors.greenPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>Mi Billetera</Text>
                <Text style={styles.walletAmount}>S/{(jugador?.saldo || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.walletBtn} disabled>
                <Ionicons name="add-circle-outline" size={18} color={colors.gray400} />
                <Text style={styles.walletBtnText}>Recargar</Text>
              </TouchableOpacity>
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
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Gradient Header
  headerGradient: {
    paddingBottom: 24,
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.greenPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A3A1F',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  // Quick stats in header
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  // Content
  content: {
    paddingHorizontal: 16,
    marginTop: -1,
  },
  // Wallet - redesigned as compact horizontal card
  walletCard: {
    backgroundColor: colors.white,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.greenLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray100,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  walletBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray400,
  },
  // Matches
  matchesSection: {
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
    color: colors.greenPrimary,
  },
});
