import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';

interface MapPickerProps {
  initialLocation: { latitude: number; longitude: number };
  onRegionChanged: (coords: { latitude: number; longitude: number }) => void;
}

export default function MapPicker({
  initialLocation,
  onRegionChanged,
}: MapPickerProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onRegionChangeComplete={(region) => {
          onRegionChanged({
            latitude: region.latitude,
            longitude: region.longitude,
          });
        }}
        showsUserLocation
        showsMyLocationButton
      />
      {/* Fixed center pin */}
      <View style={styles.pinContainer} pointerEvents="none">
        <View style={styles.pinShadow} />
        <View style={styles.pin}>
          <Ionicons name="football" size={22} color="#fff" />
        </View>
        <View style={styles.pinStick} />
        <View style={styles.pinDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -52,
    alignItems: 'center',
    width: 40,
  },
  pin: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinStick: {
    width: 3,
    height: 10,
    backgroundColor: '#10B981',
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pinShadow: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
});
