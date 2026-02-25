import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLocation } from '../../src/hooks/useLocation';
import { useCanchas } from '../../src/hooks/useCanchas';
import { CanchaConSede } from '../../src/services/canchas.service';
import { colors } from '../../src/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

type FilterType = 'todos' | 'grass_natural' | 'grass_sintetico';

const filters: { key: FilterType; label: string; icon: string }[] = [
  { key: 'todos', label: 'Todos', icon: 'grid-outline' },
  { key: 'grass_natural', label: 'Natural', icon: 'leaf-outline' },
  { key: 'grass_sintetico', label: 'Sintético', icon: 'football-outline' },
];

// Calcular distancia entre dos coordenadas
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { location, loading: locationLoading } = useLocation();
  const { canchas, loading: canchasLoading } = useCanchas();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [selectedCancha, setSelectedCancha] = useState<CanchaConSede | null>(null);

  // Filtrar canchas
  const filteredCanchas = useMemo(() => {
    let result = canchas;

    // Filtrar por tipo de superficie
    if (activeFilter !== 'todos') {
      result = result.filter(c => c.tipo_superficie === activeFilter);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(query) ||
        c.sede?.nombre?.toLowerCase().includes(query) ||
        c.sede?.distrito?.toLowerCase().includes(query)
      );
    }

    // Agregar distancia y ordenar
    return result
      .map(cancha => ({
        ...cancha,
        distance: cancha.sede?.latitud && cancha.sede?.longitud
          ? getDistance(
              location.latitude,
              location.longitude,
              Number(cancha.sede.latitud),
              Number(cancha.sede.longitud)
            )
          : 999,
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [canchas, activeFilter, searchQuery, location]);

  const handleCanchaPress = (canchaId: string) => {
    router.push(`/cancha/${canchaId}`);
  };

  const handleMarkerPress = (cancha: CanchaConSede) => {
    setSelectedCancha(cancha);
    if (cancha.sede?.latitud && cancha.sede?.longitud) {
      mapRef.current?.animateToRegion({
        latitude: Number(cancha.sede.latitud),
        longitude: Number(cancha.sede.longitud),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const centerOnUser = () => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 500);
  };

  if (locationLoading || canchasLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.greenPrimary} />
        <Text style={styles.loadingText}>Buscando canchas cercanas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredCanchas.map((cancha) => {
          if (!cancha.sede?.latitud || !cancha.sede?.longitud) return null;
          const isSelected = selectedCancha?.id === cancha.id;
          return (
            <Marker
              key={cancha.id}
              identifier={cancha.id}
              coordinate={{
                latitude: Number(cancha.sede.latitud),
                longitude: Number(cancha.sede.longitud),
              }}
              onPress={() => handleMarkerPress(cancha)}
              tracksViewChanges={false}
            >
              <View style={[
                styles.priceMarker,
                isSelected && styles.priceMarkerSelected
              ]}>
                <Text style={styles.priceMarkerText}>S/{cancha.precio_hora}</Text>
              </View>
              <View style={[
                styles.markerArrow,
                isSelected && styles.markerArrowSelected
              ]} />
            </Marker>
          );
        })}
      </MapView>

      {/* Header con buscador y filtros */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cancha o ubicación..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={14}
                  color={isActive ? colors.white : colors.gray700}
                />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Botón centrar ubicación */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={20} color={colors.greenPrimary} />
      </TouchableOpacity>

      {/* Lista de canchas cercanas - Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Handle indicator */}
        <View style={styles.sheetHandle} />

        <View style={styles.bottomSheetHeader}>
          <View>
            <Text style={styles.bottomSheetTitle}>Canchas Cercanas</Text>
            <Text style={styles.bottomSheetSubtitle}>
              {filteredCanchas.length} encontradas
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.canchasScroll}
          snapToInterval={CARD_WIDTH + 12}
          decelerationRate="fast"
        >
          {filteredCanchas.map((cancha) => (
            <TouchableOpacity
              key={cancha.id}
              style={[
                styles.canchaCard,
                selectedCancha?.id === cancha.id && styles.canchaCardSelected,
              ]}
              onPress={() => handleCanchaPress(cancha.id)}
              activeOpacity={0.9}
            >
              {/* Horizontal layout: image left, info right */}
              <View style={styles.canchaCardInner}>
                <Image
                  source={{
                    uri: cancha.foto_url ||
                      'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=400&q=70',
                  }}
                  style={styles.canchaImage}
                />

                <View style={styles.canchaInfo}>
                  <Text style={styles.canchaName} numberOfLines={1}>
                    {cancha.nombre}
                  </Text>

                  <View style={styles.canchaLocation}>
                    <Ionicons name="location" size={12} color={colors.greenPrimary} />
                    <Text style={styles.canchaDistance}>
                      {cancha.distance < 1
                        ? `${(cancha.distance * 1000).toFixed(0)} m`
                        : `${cancha.distance.toFixed(1)} km`}
                    </Text>
                    <Text style={styles.canchaSede} numberOfLines={1}>
                      • {cancha.sede?.nombre}
                    </Text>
                  </View>

                  {/* Features as icons */}
                  <View style={styles.canchaFeatures}>
                    <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="leaf" size={12} color={colors.greenPrimary} />
                    </View>
                    {cancha.tiene_iluminacion && (
                      <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="bulb" size={12} color="#F59E0B" />
                      </View>
                    )}
                    {cancha.tiene_vestuarios && (
                      <View style={[styles.featureIcon, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="shirt" size={12} color="#3B82F6" />
                      </View>
                    )}
                    <View style={styles.capacityChip}>
                      <Text style={styles.capacityText}>{cancha.capacidad}</Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={styles.priceRow}>
                    <Text style={styles.canchaPrice}>S/{cancha.precio_hora}</Text>
                    <Text style={styles.priceUnit}>/hora</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCanchas.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="football-outline" size={40} color={colors.gray200} />
              <Text style={styles.emptyText}>No se encontraron canchas</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.gray500,
    fontWeight: '500',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.gray900,
    fontWeight: '500',
  },
  filtersContainer: {
    paddingTop: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipActive: {
    backgroundColor: colors.greenPrimary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray700,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  // Location button
  locationButton: {
    position: 'absolute',
    right: 16,
    top: '42%',
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  // Map markers
  priceMarker: {
    backgroundColor: colors.greenPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceMarkerSelected: {
    backgroundColor: '#059669',
    transform: [{ scale: 1.15 }],
  },
  priceMarkerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.greenPrimary,
    alignSelf: 'center',
    marginTop: -1,
  },
  markerArrowSelected: {
    borderTopColor: '#059669',
  },
  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginBottom: 12,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gray900,
  },
  bottomSheetSubtitle: {
    fontSize: 13,
    color: colors.greenPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  canchasScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  // Cancha Card - Compact horizontal
  canchaCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  canchaCardSelected: {
    borderColor: colors.greenPrimary,
    borderWidth: 2,
  },
  canchaCardInner: {
    flexDirection: 'row',
  },
  canchaImage: {
    width: 100,
    height: 120,
    backgroundColor: colors.gray100,
  },
  canchaInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  canchaName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  canchaLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  canchaDistance: {
    fontSize: 12,
    color: colors.gray500,
    fontWeight: '600',
  },
  canchaSede: {
    fontSize: 12,
    color: colors.gray400,
    flex: 1,
  },
  canchaFeatures: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 8,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capacityChip: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gray700,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  canchaPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.greenPrimary,
  },
  priceUnit: {
    fontSize: 11,
    color: colors.gray400,
    marginLeft: 2,
  },
  emptyState: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray400,
  },
});
