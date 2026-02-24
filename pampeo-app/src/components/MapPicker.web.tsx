import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import { Ionicons } from '@expo/vector-icons';

interface MapPickerProps {
  tempMarker: { latitude: number; longitude: number } | null;
  defaultLocation: { latitude: number; longitude: number };
  onMapPress: (event: any) => void;
  onMarkerDragEnd: (coordinate: { latitude: number; longitude: number }) => void;
}

export default function MapPicker(_props: MapPickerProps) {
  return (
    <View style={styles.webMapPlaceholder}>
      <Ionicons name="map-outline" size={64} color="#9CA3AF" />
      <Text style={styles.webMapText}>
        El mapa solo está disponible en la app móvil
      </Text>
      <Text style={styles.webMapSubtext}>
        Usa Expo Go en tu celular para seleccionar la ubicación
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
