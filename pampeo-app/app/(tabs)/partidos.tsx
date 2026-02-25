import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePartidosDisponibles } from '../../src/hooks/usePartido';
import { PartidoCard } from '../../src/components/partido/PartidoCard';
import { colors } from '../../src/theme';

export default function PartidosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { partidos, loading, refetch } = usePartidosDisponibles();

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={['#0F2A14', '#1A3A1F', '#22C55E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Partidos</Text>
            <Text style={styles.headerSubtitle}>Únete a un partido cerca de ti</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="football" size={16} color={colors.white} />
            <Text style={styles.headerBadgeText}>{partidos.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {loading && partidos.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : partidos.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="football-outline" size={48} color={colors.gray400} />
          </View>
          <Text style={styles.emptyTitle}>No hay partidos disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Sé el primero en crear uno desde una cancha
          </Text>
        </View>
      ) : (
        <FlatList
          data={partidos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={colors.greenPrimary} />
          }
          renderItem={({ item }) => (
            <PartidoCard
              partido={item}
              onPress={() => router.push(`/partido/${item.id}` as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  list: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray700,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
  },
});
