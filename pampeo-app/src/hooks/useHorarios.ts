import { useState, useEffect, useCallback } from 'react';
import { sedesService } from '../services/sedes.service';
import { Horario } from '../types/database.types';

export function useHorarios(canchaId: string) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHorarios = useCallback(async () => {
    if (!canchaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await sedesService.getHorariosByCancha(canchaId);
      setHorarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  }, [canchaId]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  const getHorasForDia = (dia: number): Set<string> => {
    return new Set(
      horarios
        .filter((h) => h.dia_semana === dia && h.disponible)
        .map((h) => h.hora_inicio.substring(0, 5)) // '08:00:00' → '08:00'
    );
  };

  const saveDia = async (dia: number, horas: string[]) => {
    setSaving(true);
    try {
      await sedesService.setHorariosDia(canchaId, dia, horas);
      await fetchHorarios();
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { horarios, loading, saving, error, getHorasForDia, saveDia, refetch: fetchHorarios };
}
