import { supabase } from './supabase';
import { Cancha, Sede } from '../types/database.types';

export interface CanchaConSede extends Cancha {
  sede: Sede;
}

export const canchasService = {
  async getCanchasAprobadas(): Promise<CanchaConSede[]> {
    const { data, error } = await supabase
      .from('canchas')
      .select(`
        *,
        sede:sedes(*)
      `)
      .eq('activo', true)
      .eq('aprobado', true);

    if (error) throw error;
    return data as CanchaConSede[];
  },

  async getCanchaById(id: string): Promise<CanchaConSede | null> {
    const { data, error } = await supabase
      .from('canchas')
      .select(`
        *,
        sede:sedes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CanchaConSede;
  },

  async getCanchasBySede(sedeId: string): Promise<Cancha[]> {
    const { data, error } = await supabase
      .from('canchas')
      .select('*')
      .eq('sede_id', sedeId)
      .eq('activo', true);

    if (error) throw error;
    return data;
  },

  async getCanchasNearby(
    lat: number,
    lng: number,
    radiusKm: number = 10
  ): Promise<CanchaConSede[]> {
    // Por ahora retornamos todas las canchas aprobadas
    // En el futuro se puede implementar filtro por distancia con PostGIS
    const { data, error } = await supabase
      .from('canchas')
      .select(`
        *,
        sede:sedes(*)
      `)
      .eq('activo', true)
      .eq('aprobado', true);

    if (error) throw error;

    // Filtrar por distancia en el cliente
    const canchasConDistancia = (data as CanchaConSede[]).filter((cancha) => {
      if (!cancha.sede?.latitud || !cancha.sede?.longitud) return false;
      const distance = getDistanceFromLatLonInKm(
        lat,
        lng,
        Number(cancha.sede.latitud),
        Number(cancha.sede.longitud)
      );
      return distance <= radiusKm;
    });

    return canchasConDistancia;
  },

  async getHorariosCancha(canchaId: string) {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('cancha_id', canchaId)
      .eq('disponible', true)
      .order('dia_semana')
      .order('hora_inicio');

    if (error) throw error;
    return data;
  },
};

// Funcion para calcular distancia entre dos coordenadas
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}