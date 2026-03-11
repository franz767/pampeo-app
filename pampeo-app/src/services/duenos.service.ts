import { supabase } from './supabase';

interface DatosYape {
  numero_yape: string;
  nombre_yape: string;
  qr_yape_url?: string | null;
}

export const duenosService = {
  async actualizarDatosYape(duenoId: string, datos: DatosYape): Promise<void> {
    const { error } = await supabase
      .from('duenos')
      .update({
        numero_yape: datos.numero_yape,
        nombre_yape: datos.nombre_yape,
        qr_yape_url: datos.qr_yape_url || null,
      })
      .eq('id', duenoId);

    if (error) throw error;
  },

  async getDatosYapePorSede(sedeId: string): Promise<DatosYape | null> {
    const { data, error } = await supabase
      .from('sedes')
      .select(`
        dueno_id,
        dueno:duenos!dueno_id(
          numero_yape, nombre_yape, qr_yape_url, perfil_id,
          perfil:perfiles!perfil_id(telefono)
        )
      `)
      .eq('id', sedeId)
      .single();

    if (error) throw error;
    const dueno = (data as any)?.dueno;
    if (!dueno?.numero_yape) return null;

    return {
      numero_yape: dueno.numero_yape,
      nombre_yape: dueno.nombre_yape,
      qr_yape_url: dueno.qr_yape_url,
    };
  },
};
