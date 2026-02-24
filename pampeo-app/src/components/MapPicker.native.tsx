import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';

interface MapPickerProps {
  tempMarker: { latitude: number; longitude: number } | null;
  defaultLocation: { latitude: number; longitude: number };
  onMapPress: (event: any) => void;
  onMarkerDragEnd: (coordinate: { latitude: number; longitude: number }) => void;
}

export default function MapPicker({
  tempMarker,
  defaultLocation,
  onMapPress,
  onMarkerDragEnd,
}: MapPickerProps) {
  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: tempMarker?.latitude || defaultLocation.latitude,
        longitude: tempMarker?.longitude || defaultLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onPress={onMapPress}
      showsUserLocation
    >
      {tempMarker && (
        <Marker
          coordinate={{
            latitude: tempMarker.latitude,
            longitude: tempMarker.longitude,
          }}
          draggable
          onDragEnd={(e: any) => onMarkerDragEnd(e.nativeEvent.coordinate)}
        >
          <View style={styles.customMarker}>
            <Ionicons name="football" size={24} color="#fff" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
