import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePartidosDisponibles } from '../../src/hooks/usePartido';
import { PartidoCard } from '../../src/components/partido/PartidoCard';
import { colors } from '../../src/theme';

export default function PartidosScreen() {
  const router = useRouter();
  const { partidos, loading, refetch } = usePartidosDisponibles();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Partidos Disponibles</Text>
        <Text style={styles.headerSubtitle}>Únete a un partido cerca de ti</Text>
      </View>

      {loading && partidos.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.greenPrimary} />
        </View>
      ) : partidos.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="football-outline" size={56} color={colors.gray200} />
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
    backgroundColor: colors.gray50,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gray900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray700,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
  },
});
