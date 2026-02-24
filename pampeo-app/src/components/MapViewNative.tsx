import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';
import { CanchaConSede } from '../services/canchas.service';
import { CanchaCard } from './CanchaCard';

interface MapViewNativeProps {
  location: { latitude: number; longitude: number };
  canchas: CanchaConSede[];
  selectedCancha: CanchaConSede | null;
  onMarkerPress: (cancha: CanchaConSede) => void;
  onCanchaPress: (id: string) => void;
  showList: boolean;
  onToggleList: () => void;
  isUsingDefault: boolean;
}

export function MapViewNative({
  location,
  canchas,
  selectedCancha,
  onMarkerPress,
  onCanchaPress,
  showList,
  onToggleList,
  isUsingDefault,
}: MapViewNativeProps) {
  const mapRef = useRef<MapView>(null);

  const centerOnUser = () => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  return (
    <View style={styles.container}>
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
        {canchas.map((cancha) => {
          if (!cancha.sede?.latitud || !cancha.sede?.longitud) return null;
          return (
            <Marker
              key={cancha.id}
              coordinate={{
                latitude: Number(cancha.sede.latitud),
                longitude: Number(cancha.sede.longitud),
              }}
              onPress={() => onMarkerPress(cancha)}
            >
              <View
                style={[
                  styles.markerContainer,
                  selectedCancha?.id === cancha.id && styles.markerSelected,
                ]}
              >
                <Ionicons name="football" size={20} color="#fff" />
              </View>
              <Callout tooltip>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{cancha.nombre}</Text>
                  <Text style={styles.calloutSubtitle}>{cancha.sede.nombre}</Text>
                  <Text style={styles.calloutPrice}>
                    S/{cancha.precio_hora}/hora
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.locationButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#10B981" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.toggleButton} onPress={onToggleList}>
        <Ionicons name={showList ? 'map' : 'list'} size={20} color="#fff" />
        <Text style={styles.toggleText}>{showList ? 'Mapa' : 'Lista'}</Text>
      </TouchableOpacity>

      {isUsingDefault && (
        <View style={styles.defaultLocationBanner}>
          <Ionicons name="information-circle" size={16} color="#F59E0B" />
          <Text style={styles.defaultLocationText}>
            Mostrando Jauja, Peru (ubicacion por defecto)
          </Text>
        </View>
      )}

      {selectedCancha && !showList && (
        <View style={styles.selectedCardContainer}>
          <CanchaCard
            cancha={selectedCancha}
            onPress={() => onCanchaPress(selectedCancha.id)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerSelected: {
    backgroundColor: '#059669',
    transform: [{ scale: 1.2 }],
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 4,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  toggleButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  defaultLocationBanner: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultLocationText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
  },
  selectedCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});