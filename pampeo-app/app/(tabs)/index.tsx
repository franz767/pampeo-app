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

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

type FilterType = 'todos' | 'grass_natural' | 'grass_sintetico';

const filters: { key: FilterType; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'grass_natural', label: 'Grass Natural' },
  { key: 'grass_sintetico', label: 'Sintético' },
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
        <ActivityIndicator size="large" color="#10B981" />
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
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cancha o ubicación..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Botón centrar ubicación */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={22} color="#1F2937" />
      </TouchableOpacity>

      {/* Lista de canchas cercanas */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>Canchas Cercanas</Text>
          <Text style={styles.bottomSheetSubtitle}>
            {filteredCanchas.length} encontradas
          </Text>
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
              <Image
                source={{
                  uri: cancha.foto_url ||
                    'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=400&q=70',
                }}
                style={styles.canchaImage}
              />

              {/* Badge capacidad */}
              <View style={styles.capacityBadge}>
                <Text style={styles.capacityText}>{cancha.capacidad}</Text>
              </View>

              <View style={styles.canchaInfo}>
                <View style={styles.canchaHeader}>
                  <Text style={styles.canchaName} numberOfLines={1}>
                    {cancha.nombre}
                  </Text>
                  <Text style={styles.canchaPrice}>S/{cancha.precio_hora}</Text>
                </View>

                <View style={styles.canchaLocation}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.canchaDistance}>
                    {cancha.distance < 1
                      ? `${(cancha.distance * 1000).toFixed(0)} m`
                      : `${cancha.distance.toFixed(1)} km`}
                  </Text>
                  <Text style={styles.canchaSede} numberOfLines={1}>
                    • {cancha.sede?.nombre}
                  </Text>
                </View>

                <View style={styles.canchaFeatures}>
                  <View style={styles.featureTag}>
                    <Ionicons name="leaf" size={12} color="#10B981" />
                    <Text style={styles.featureText}>
                      {cancha.tipo_superficie === 'grass_natural' ? 'Natural' : 'Sintético'}
                    </Text>
                  </View>
                  {cancha.tiene_iluminacion && (
                    <View style={styles.featureTag}>
                      <Ionicons name="bulb" size={12} color="#F59E0B" />
                      <Text style={styles.featureText}>Luz</Text>
                    </View>
                  )}
                  {cancha.tiene_vestuarios && (
                    <View style={styles.featureTag}>
                      <Ionicons name="shirt" size={12} color="#6366F1" />
                      <Text style={styles.featureText}>Vestuarios</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredCanchas.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="football-outline" size={40} color="#D1D5DB" />
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filtersContainer: {
    paddingTop: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    top: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  priceMarker: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  priceMarkerSelected: {
    backgroundColor: '#059669',
    transform: [{ scale: 1.1 }],
  },
  priceMarkerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
    borderTopColor: '#10B981',
    alignSelf: 'center',
    marginTop: -1,
  },
  markerArrowSelected: {
    borderTopColor: '#059669',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  canchasScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  canchaCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  canchaCardSelected: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  canchaImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
  },
  capacityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capacityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  canchaInfo: {
    padding: 12,
  },
  canchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  canchaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  canchaPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  canchaLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  canchaDistance: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  canchaSede: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  canchaFeatures: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyState: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
