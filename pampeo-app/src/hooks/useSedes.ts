import { useState, useEffect, useCallback } from 'react';
import { sedesService, SedeConCanchas } from '../services/sedes.service';
import { useAuth } from './useAuth';

export function useSedes() {
  const { dueno } = useAuth();
  const [sedes, setSedes] = useState<SedeConCanchas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSedes = useCallback(async () => {
    if (!dueno?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await sedesService.getSedesByDueno(dueno.id);
      setSedes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar sedes');
    } finally {
      setLoading(false);
    }
  }, [dueno?.id]);

  useEffect(() => {
    fetchSedes();
  }, [fetchSedes]);

  return {
    sedes,
    loading,
    error,
    refetch: fetchSedes,
    totalCanchas: sedes.reduce((acc, sede) => acc + (sede.canchas?.length || 0), 0),
  };
}