import { useState, useEffect, useCallback, useMemo } from 'react';
import { partidosService, PartidoConDetalles } from '../services/partidos.service';

export function usePartido(partidoId: string, jugadorId?: string, perfilId?: string) {
  const [partido, setPartido] = useState<PartidoConDetalles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPartido = useCallback(async () => {
    if (!partidoId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await partidosService.getPartidoById(partidoId);
      setPartido(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar partido');
    } finally {
      setLoading(false);
    }
  }, [partidoId]);

  useEffect(() => {
    fetchPartido();
  }, [fetchPartido]);

  const jugadoresConfirmados = useMemo(
    () => partido?.jugadores_partido?.filter((jp) => jp.estado === 'confirmado') || [],
    [partido]
  );

  const estaUnido = useMemo(
    () => jugadorId ? jugadoresConfirmados.some((jp) => jp.jugador_id === jugadorId) : false,
    [jugadoresConfirmados, jugadorId]
  );

  const esCreador = useMemo(
    () => perfilId ? partido?.creador_id === perfilId : false,
    [partido, perfilId]
  );

  const estaLleno = partido?.estado === 'lleno';
  const estaCancelado = partido?.estado === 'cancelado';

  const unirse = useCallback(async () => {
    if (!jugadorId || !partidoId) return;
    setActionLoading(true);
    try {
      await partidosService.unirseAPartido(partidoId, jugadorId);
      await fetchPartido();
    } catch (err: any) {
      setError(err.message || 'Error al unirse');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [partidoId, jugadorId, fetchPartido]);

  const salir = useCallback(async () => {
    if (!jugadorId || !partidoId) return;
    setActionLoading(true);
    try {
      await partidosService.salirDePartido(partidoId, jugadorId);
      await fetchPartido();
    } catch (err: any) {
      setError(err.message || 'Error al salir');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [partidoId, jugadorId, fetchPartido]);

  const cancelar = useCallback(async () => {
    if (!partidoId) return;
    setActionLoading(true);
    try {
      await partidosService.cancelarPartido(partidoId);
      await fetchPartido();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [partidoId, fetchPartido]);

  return {
    partido,
    loading,
    error,
    actionLoading,
    jugadoresConfirmados,
    estaUnido,
    esCreador,
    estaLleno,
    estaCancelado,
    unirse,
    salir,
    cancelar,
    refetch: fetchPartido,
  };
}

export function usePartidosDisponibles() {
  const [partidos, setPartidos] = useState<PartidoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await partidosService.getPartidosDisponibles();
      setPartidos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar partidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartidos();
  }, [fetchPartidos]);

  return { partidos, loading, error, refetch: fetchPartidos };
}

export function useMisPartidos(jugadorId?: string) {
  const [partidos, setPartidos] = useState<PartidoConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartidos = useCallback(async () => {
    if (!jugadorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await partidosService.getMisPartidos(jugadorId);
      setPartidos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar mis partidos');
    } finally {
      setLoading(false);
    }
  }, [jugadorId]);

  useEffect(() => {
    fetchPartidos();
  }, [fetchPartidos]);

  return { partidos, loading, error, refetch: fetchPartidos };
}
