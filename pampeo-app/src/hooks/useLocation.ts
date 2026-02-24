import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number;
  longitude: number;
}

// Coordenadas por defecto: Jauja, Peru
const DEFAULT_LOCATION: LocationState = {
  latitude: -11.775,
  longitude: -75.4972,
};

export function useLocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (err) {
      setError('Error al solicitar permisos');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermission();

      if (!hasPermission) {
        setLocation(DEFAULT_LOCATION);
        setError('Permiso de ubicacion denegado');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      setError('Error al obtener ubicacion');
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    location: location || DEFAULT_LOCATION,
    loading,
    error,
    permissionStatus,
    requestPermission,
    refreshLocation: getCurrentLocation,
    isUsingDefault: !location || (location.latitude === DEFAULT_LOCATION.latitude && location.longitude === DEFAULT_LOCATION.longitude),
  };
}