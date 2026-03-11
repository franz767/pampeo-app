import { supabase } from './supabase';
import { Partido, JugadorPartido, Cancha, Sede, Jugador, Perfil } from '../types/database.types';

export interface JugadorPartidoConPerfil extends JugadorPartido {
  jugador: Jugador & { perfil: Perfil };
}

export interface PartidoConDetalles extends Partido {
  cancha: Cancha & { sede: Sede };
  jugadores_partido: JugadorPartidoConPerfil[];
}

interface CrearPartidoInput {
  cancha_id: string;
  creador_id: string;
  formato: '5v5' | '6v6';
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  max_jugadores: number;
  precio_por_jugador: number;
}

interface CrearReservaInput {
  cancha_id: string;
  creador_id: string;
  formato: '5v5' | '6v6';
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  precio_cancha: number;
  adelanto_pagado: number;
  comision_pampeo: number;
}

export interface ReservaConDetalles extends Partido {
  cancha: Cancha & { sede: Sede };
  adelanto_pagado?: number;
  restante_por_pagar?: number;
}

const PARTIDO_SELECT = `
  *,
  cancha:canchas(
    *,
    sede:sedes(*)
  ),
  jugadores_partido(
    *,
    jugador:jugadores(
      *,
      perfil:perfiles(*)
    )
  )
`;

export const partidosService = {
  async crearPartido(input: CrearPartidoInput): Promise<Partido> {
    const { data, error } = await supabase
      .from('partidos')
      .insert({
        ...input,
        tipo: 'publico' as const,
        estado: 'abierto' as const,
        jugadores_confirmados: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar partido existente para un slot específico
  async getPartidoPorSlot(
    canchaId: string,
    fecha: string,
    horaInicio: string
  ): Promise<Partido | null> {
    const { data, error } = await supabase
      .from('partidos')
      .select('*')
      .eq('cancha_id', canchaId)
      .eq('fecha', fecha)
      .eq('hora_inicio', horaInicio)
      .in('estado', ['abierto', 'lleno'])
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async unirseAPartido(partidoId: string, jugadorId: string): Promise<void> {
    // Obtener partido con precio
    const { data: partido, error: fetchError } = await supabase
      .from('partidos')
      .select('estado, jugadores_confirmados, max_jugadores, precio_por_jugador')
      .eq('id', partidoId)
      .single();

    if (fetchError) throw fetchError;
    if (!partido) throw new Error('Partido no encontrado');
    if (partido.estado !== 'abierto') throw new Error('El partido no está abierto');
    if (partido.jugadores_confirmados >= partido.max_jugadores) throw new Error('El partido está lleno');

    // Verificar saldo del jugador
    const { data: jugador, error: jugadorError } = await supabase
      .from('jugadores')
      .select('saldo')
      .eq('id', jugadorId)
      .single();

    if (jugadorError) throw jugadorError;
    if (!jugador) throw new Error('Jugador no encontrado');

    const saldo = jugador.saldo || 0;
    if (saldo < partido.precio_por_jugador) {
      throw new Error(`Saldo insuficiente. Necesitas S/${partido.precio_por_jugador} y tienes S/${saldo.toFixed(2)}`);
    }

    // Verificar que no esté ya unido
    const { data: existente } = await supabase
      .from('jugadores_partido')
      .select('id, estado')
      .eq('partido_id', partidoId)
      .eq('jugador_id', jugadorId)
      .maybeSingle();

    if (existente && existente.estado === 'confirmado') {
      throw new Error('Ya estás en este partido');
    }

    // Descontar saldo
    const { error: saldoError } = await supabase
      .from('jugadores')
      .update({ saldo: saldo - partido.precio_por_jugador })
      .eq('id', jugadorId);

    if (saldoError) throw saldoError;

    // Si estaba cancelado, reactivar; si no existe, insertar
    if (existente) {
      const { error } = await supabase
        .from('jugadores_partido')
        .update({ estado: 'confirmado' })
        .eq('id', existente.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('jugadores_partido')
        .insert({
          partido_id: partidoId,
          jugador_id: jugadorId,
          estado: 'confirmado',
        });
      if (error) throw error;
    }

    // Incrementar contador
    const nuevosConfirmados = partido.jugadores_confirmados + 1;
    const nuevoEstado = nuevosConfirmados >= partido.max_jugadores ? 'lleno' : 'abierto';

    const { error: updateError } = await supabase
      .from('partidos')
      .update({
        jugadores_confirmados: nuevosConfirmados,
        estado: nuevoEstado as any,
      })
      .eq('id', partidoId);

    if (updateError) throw updateError;
  },

  async salirDePartido(partidoId: string, jugadorId: string): Promise<void> {
    // Obtener precio del partido para devolver saldo
    const { data: partido, error: fetchError } = await supabase
      .from('partidos')
      .select('jugadores_confirmados, estado, precio_por_jugador')
      .eq('id', partidoId)
      .single();

    if (fetchError) throw fetchError;

    // Cancelar participación
    const { error: jpError } = await supabase
      .from('jugadores_partido')
      .update({ estado: 'cancelado' })
      .eq('partido_id', partidoId)
      .eq('jugador_id', jugadorId)
      .eq('estado', 'confirmado');

    if (jpError) throw jpError;

    // Devolver saldo al jugador
    const { data: jugador, error: jugadorError } = await supabase
      .from('jugadores')
      .select('saldo')
      .eq('id', jugadorId)
      .single();

    if (!jugadorError && jugador) {
      const nuevoSaldo = (jugador.saldo || 0) + (partido?.precio_por_jugador || 0);
      await supabase
        .from('jugadores')
        .update({ saldo: nuevoSaldo })
        .eq('id', jugadorId);
    }

    // Decrementar contador y reabrir
    const nuevosConfirmados = Math.max(0, (partido?.jugadores_confirmados || 1) - 1);
    const { error: updateError } = await supabase
      .from('partidos')
      .update({
        jugadores_confirmados: nuevosConfirmados,
        estado: 'abierto' as any,
      })
      .eq('id', partidoId);

    if (updateError) throw updateError;
  },

  async cancelarPartido(partidoId: string): Promise<void> {
    // Devolver saldo a todos los jugadores confirmados
    const { data: partido } = await supabase
      .from('partidos')
      .select('precio_por_jugador')
      .eq('id', partidoId)
      .single();

    const { data: jugadoresEnPartido } = await supabase
      .from('jugadores_partido')
      .select('jugador_id')
      .eq('partido_id', partidoId)
      .eq('estado', 'confirmado');

    if (jugadoresEnPartido && partido) {
      for (const jp of jugadoresEnPartido) {
        const { data: jugador } = await supabase
          .from('jugadores')
          .select('saldo')
          .eq('id', jp.jugador_id)
          .single();

        if (jugador) {
          await supabase
            .from('jugadores')
            .update({ saldo: (jugador.saldo || 0) + partido.precio_por_jugador })
            .eq('id', jp.jugador_id);
        }
      }
    }

    const { error } = await supabase
      .from('partidos')
      .update({ estado: 'cancelado' as any })
      .eq('id', partidoId);

    if (error) throw error;
  },

  async getPartidoById(id: string): Promise<PartidoConDetalles | null> {
    const { data, error } = await supabase
      .from('partidos')
      .select(PARTIDO_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as PartidoConDetalles;
  },

  async getPartidosDisponibles(): Promise<PartidoConDetalles[]> {
    const { data, error } = await supabase
      .from('partidos')
      .select(PARTIDO_SELECT)
      .eq('estado', 'abierto')
      .eq('tipo', 'publico')
      .gte('fecha', new Date().toISOString().split('T')[0])
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return (data as unknown as PartidoConDetalles[]) || [];
  },

  async getPartidosPorCancha(canchaId: string): Promise<Partido[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('partidos')
      .select('*')
      .eq('cancha_id', canchaId)
      .gte('fecha', today)
      .in('estado', ['abierto', 'lleno'])
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getMisPartidos(jugadorId: string): Promise<PartidoConDetalles[]> {
    const { data: jpData, error: jpError } = await supabase
      .from('jugadores_partido')
      .select('partido_id')
      .eq('jugador_id', jugadorId)
      .eq('estado', 'confirmado');

    if (jpError) throw jpError;
    if (!jpData || jpData.length === 0) return [];

    const partidoIds = jpData.map((jp) => jp.partido_id);

    const { data, error } = await supabase
      .from('partidos')
      .select(PARTIDO_SELECT)
      .in('id', partidoIds)
      .neq('estado', 'cancelado')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return (data as unknown as PartidoConDetalles[]) || [];
  },

  // Obtener horarios reservados/ocupados para una cancha en una fecha
  async getHorariosOcupados(canchaId: string, fecha: string): Promise<{ hora: string; estado: string; creador_id?: string; partido_id?: string }[]> {
    const { data, error } = await supabase
      .from('partidos')
      .select('id, hora_inicio, estado, creador_id')
      .eq('cancha_id', canchaId)
      .eq('fecha', fecha)
      .in('estado', ['abierto', 'lleno', 'en_curso', 'reservado', 'en_verificacion']);

    if (error) throw error;
    return (data || []).map((p) => ({
      hora: p.hora_inicio.substring(0, 5),
      estado: p.estado,
      creador_id: p.creador_id,
      partido_id: p.id,
    }));
  },

  // Crear una reserva de cancha (modelo 50% adelanto)
  async crearReserva(input: CrearReservaInput): Promise<Partido> {
    // Verificar disponibilidad antes de crear (evitar doble reserva)
    const { data: existente } = await supabase
      .from('partidos')
      .select('id')
      .eq('cancha_id', input.cancha_id)
      .eq('fecha', input.fecha)
      .eq('hora_inicio', input.hora_inicio)
      .in('estado', ['abierto', 'lleno', 'en_curso', 'reservado', 'en_verificacion'])
      .maybeSingle();

    if (existente) {
      throw new Error('Este horario acaba de ser reservado por otro jugador. Elige otro horario.');
    }

    const maxJugadores = input.formato === '5v5' ? 10 : 12;

    const { data, error } = await supabase
      .from('partidos')
      .insert({
        cancha_id: input.cancha_id,
        creador_id: input.creador_id,
        formato: input.formato,
        fecha: input.fecha,
        hora_inicio: input.hora_inicio,
        hora_fin: input.hora_fin,
        tipo: 'reserva',
        estado: 'en_verificacion',
        max_jugadores: maxJugadores,
        jugadores_confirmados: 0,
        precio_por_jugador: Math.ceil(input.precio_cancha / maxJugadores),
        precio_cancha: input.precio_cancha,
        adelanto_pagado: input.adelanto_pagado,
        comision_pampeo: input.comision_pampeo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Descontar saldo del jugador
  async descontarSaldo(jugadorId: string, monto: number): Promise<void> {
    const { data: jugador, error: fetchError } = await supabase
      .from('jugadores')
      .select('saldo')
      .eq('id', jugadorId)
      .single();

    if (fetchError) throw fetchError;
    if (!jugador) throw new Error('Jugador no encontrado');

    const nuevoSaldo = (jugador.saldo || 0) - monto;
    if (nuevoSaldo < 0) throw new Error('Saldo insuficiente');

    const { error } = await supabase
      .from('jugadores')
      .update({ saldo: nuevoSaldo })
      .eq('id', jugadorId);

    if (error) throw error;
  },

  // Obtener reservas de una cancha (para el dueño)
  async getReservasPorCancha(canchaId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        *,
        cancha:canchas(*),
        creador:perfiles!creador_id(
          id, nombre_completo, telefono, avatar_url
        )
      `)
      .eq('cancha_id', canchaId)
      .eq('tipo', 'reserva')
      .neq('estado', 'cancelado')
      .neq('estado', 'rechazado')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Obtener reservas por confirmar (estado en_verificacion) para el dueño
  async getReservasPorConfirmar(canchaIds: string[]): Promise<any[]> {
    if (canchaIds.length === 0) return [];
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        *,
        cancha:canchas(*),
        creador:perfiles!creador_id(
          id, nombre_completo, telefono, avatar_url
        )
      `)
      .in('cancha_id', canchaIds)
      .eq('tipo', 'reserva')
      .eq('estado', 'en_verificacion')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Confirmar reserva (dueño verificó el pago)
  async confirmarReserva(reservaId: string): Promise<void> {
    const { error } = await supabase
      .from('partidos')
      .update({ estado: 'reservado' })
      .eq('id', reservaId)
      .eq('estado', 'en_verificacion');

    if (error) throw error;
  },

  // Confirmar pago total (jugador pagó el 50% restante al llegar)
  async confirmarPagoTotal(reservaId: string): Promise<void> {
    const { error } = await supabase
      .from('partidos')
      .update({ estado: 'finalizado' })
      .eq('id', reservaId)
      .eq('estado', 'reservado');

    if (error) throw error;
  },

  // Rechazar reserva (dueño no verificó el pago)
  async rechazarReserva(reservaId: string): Promise<void> {
    const { error } = await supabase
      .from('partidos')
      .update({ estado: 'rechazado' })
      .eq('id', reservaId)
      .eq('estado', 'en_verificacion');

    if (error) throw error;
  },

  // Crear notificación en la app
  async crearNotificacion(
    perfilId: string,
    titulo: string,
    mensaje: string,
    tipo: 'invitacion' | 'confirmacion' | 'pago' | 'recordatorio' | 'sistema' = 'sistema'
  ): Promise<void> {
    const { error } = await supabase
      .from('notificaciones')
      .insert({ perfil_id: perfilId, titulo, mensaje, tipo });

    if (error) throw error;
  },

  // Obtener mis reservas
  async getMisReservas(creadorId: string): Promise<ReservaConDetalles[]> {
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        *,
        cancha:canchas(
          *,
          sede:sedes(*)
        )
      `)
      .eq('creador_id', creadorId)
      .eq('tipo', 'reserva')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return (data as unknown as ReservaConDetalles[]) || [];
  },

  // Subir comprobante de Yape y actualizar reserva
  async subirComprobanteYape(reservaId: string, comprobanteUrl: string): Promise<void> {
    const { error } = await supabase
      .from('partidos')
      .update({ comprobante_url: comprobanteUrl })
      .eq('id', reservaId);

    if (error) throw error;
  },

  // Crear reseña de cancha
  async crearResena(
    canchaId: string,
    jugadorId: string,
    partidoId: string,
    calificacion: number,
    comentario?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('resenas')
      .insert({
        cancha_id: canchaId,
        jugador_id: jugadorId,
        partido_id: partidoId,
        calificacion,
        comentario: comentario || null,
      });

    if (error) throw error;
  },

  // Verificar si ya dejó reseña para un partido
  async getResenaDePartido(partidoId: string, jugadorId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('resenas')
      .select('id')
      .eq('partido_id', partidoId)
      .eq('jugador_id', jugadorId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};
