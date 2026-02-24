import { supabase } from './supabase';
import { Sede, Cancha, Horario } from '../types/database.types';

export interface SedeConCanchas extends Sede {
  canchas: Cancha[];
}

export interface CreateSedeInput {
  dueno_id: string;
  nombre: string;
  direccion: string;
  distrito?: string;
  ciudad?: string;
  departamento?: string;
  latitud: number;
  longitud: number;
  telefono_contacto?: string;
}

export interface CreateCanchaInput {
  sede_id: string;
  nombre: string;
  tipo_superficie: 'grass_natural' | 'grass_sintetico' | 'cemento';
  capacidad: '5v5' | '6v6' | '5v5_6v6';
  precio_hora: number;
  largo_metros?: number;
  ancho_metros?: number;
  tiene_iluminacion?: boolean;
  tiene_vestuarios?: boolean;
  tiene_estacionamiento?: boolean;
  foto_url?: string;
}

export const sedesService = {
  async getSedesByDueno(duenoId: string): Promise<SedeConCanchas[]> {
    const { data, error } = await supabase
      .from('sedes')
      .select(`
        *,
        canchas(*)
      `)
      .eq('dueno_id', duenoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SedeConCanchas[];
  },

  async getSedeById(id: string): Promise<SedeConCanchas | null> {
    const { data, error } = await supabase
      .from('sedes')
      .select(`
        *,
        canchas(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as SedeConCanchas;
  },

  async createSede(input: CreateSedeInput): Promise<Sede> {
    const { data, error } = await supabase
      .from('sedes')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSede(id: string, input: Partial<CreateSedeInput>): Promise<Sede> {
    const { data, error } = await supabase
      .from('sedes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSede(id: string): Promise<void> {
    const { error } = await supabase
      .from('sedes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createCancha(input: CreateCanchaInput): Promise<Cancha> {
    const { data, error } = await supabase
      .from('canchas')
      .insert({
        ...input,
        activo: true,
        aprobado: true, // MVP: canchas se aprueban automaticamente
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCancha(id: string, input: Partial<CreateCanchaInput>): Promise<Cancha> {
    const { data, error } = await supabase
      .from('canchas')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCanchaFoto(canchaId: string, fotoUrl: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('canchas')
      .update({ foto_url: fotoUrl })
      .eq('id', canchaId);
    if (error) throw error;
  },

  async deleteCancha(id: string): Promise<void> {
    const { error } = await supabase
      .from('canchas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCanchasBySede(sedeId: string): Promise<Cancha[]> {
    const { data, error } = await supabase
      .from('canchas')
      .select('*')
      .eq('sede_id', sedeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // === HORARIOS ===

  async getHorariosByCancha(canchaId: string): Promise<Horario[]> {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('cancha_id', canchaId)
      .order('dia_semana')
      .order('hora_inicio');

    if (error) throw error;
    return data;
  },

  async setHorariosDia(canchaId: string, diaSemana: number, horasDisponibles: string[]): Promise<void> {
    // Delete existing for this cancha + day
    const { error: deleteError } = await supabase
      .from('horarios')
      .delete()
      .eq('cancha_id', canchaId)
      .eq('dia_semana', diaSemana);

    if (deleteError) throw deleteError;

    if (horasDisponibles.length === 0) return;

    const inserts = horasDisponibles.map((hora) => ({
      cancha_id: canchaId,
      dia_semana: diaSemana,
      hora_inicio: hora,
      hora_fin: `${String(parseInt(hora) + 1).padStart(2, '0')}:00`,
      disponible: true,
    }));

    const { error: insertError } = await supabase
      .from('horarios')
      .insert(inserts);

    if (insertError) throw insertError;
  },
};