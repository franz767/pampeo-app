import { useState, useEffect, useCallback } from 'react';
import { canchasService, CanchaConSede } from '../services/canchas.service';

interface Filters {
  capacidad?: '5v5' | '6v6' | '5v5_6v6';
  tipoSuperficie?: 'grass_natural' | 'grass_sintetico' | 'cemento';
  precioMax?: number;
  conIluminacion?: boolean;
}

export function useCanchas(filters?: Filters) {
  const [canchas, setCanchas] = useState<CanchaConSede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanchas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data = await canchasService.getCanchasAprobadas();

      // Aplicar filtros en el cliente
      if (filters) {
        if (filters.capacidad) {
          data = data.filter(
            (c) => c.capacidad === filters.capacidad || c.capacidad === '5v5_6v6'
          );
        }
        if (filters.tipoSuperficie) {
          data = data.filter((c) => c.tipo_superficie === filters.tipoSuperficie);
        }
        if (filters.precioMax) {
          data = data.filter((c) => c.precio_hora <= filters.precioMax!);
        }
        if (filters.conIluminacion) {
          data = data.filter((c) => c.tiene_iluminacion);
        }
      }

      setCanchas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar canchas');
    } finally {
      setLoading(false);
    }
  }, [filters?.capacidad, filters?.tipoSuperficie, filters?.precioMax, filters?.conIluminacion]);

  useEffect(() => {
    fetchCanchas();
  }, [fetchCanchas]);

  return {
    canchas,
    loading,
    error,
    refetch: fetchCanchas,
  };
}