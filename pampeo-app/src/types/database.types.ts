export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          email: string;
          nombre_completo: string | null;
          telefono: string | null;
          avatar_url: string | null;
          rol: 'jugador' | 'dueno' | 'admin';
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'jugador' | 'dueno' | 'admin';
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'jugador' | 'dueno' | 'admin';
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      jugadores: {
        Row: {
          id: string;
          perfil_id: string;
          apodo: string | null;
          posicion: 'arquero' | 'defensa' | 'mediocampista' | 'delantero' | null;
          nivel: 'principiante' | 'intermedio' | 'avanzado' | null;
          zona_preferida: string | null;
          partidos_jugados: number;
          goles: number;
          asistencias: number;
          partidos_ganados: number;
          saldo: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          apodo?: string | null;
          posicion?: 'arquero' | 'defensa' | 'mediocampista' | 'delantero' | null;
          nivel?: 'principiante' | 'intermedio' | 'avanzado' | null;
          zona_preferida?: string | null;
          partidos_jugados?: number;
          goles?: number;
          asistencias?: number;
          partidos_ganados?: number;
          saldo?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          apodo?: string | null;
          posicion?: 'arquero' | 'defensa' | 'mediocampista' | 'delantero' | null;
          nivel?: 'principiante' | 'intermedio' | 'avanzado' | null;
          zona_preferida?: string | null;
          partidos_jugados?: number;
          goles?: number;
          asistencias?: number;
          partidos_ganados?: number;
          saldo?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      duenos: {
        Row: {
          id: string;
          perfil_id: string;
          dni: string | null;
          ruc: string | null;
          banco: string | null;
          cuenta_bancaria: string | null;
          verificado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          dni?: string | null;
          ruc?: string | null;
          banco?: string | null;
          cuenta_bancaria?: string | null;
          verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          dni?: string | null;
          ruc?: string | null;
          banco?: string | null;
          cuenta_bancaria?: string | null;
          verificado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sedes: {
        Row: {
          id: string;
          dueno_id: string;
          nombre: string;
          direccion: string;
          distrito: string | null;
          ciudad: string | null;
          departamento: string | null;
          latitud: number;
          longitud: number;
          telefono_contacto: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dueno_id: string;
          nombre: string;
          direccion: string;
          distrito?: string | null;
          ciudad?: string | null;
          departamento?: string | null;
          latitud: number;
          longitud: number;
          telefono_contacto?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dueno_id?: string;
          nombre?: string;
          direccion?: string;
          distrito?: string | null;
          ciudad?: string | null;
          departamento?: string | null;
          latitud?: number;
          longitud?: number;
          telefono_contacto?: string | null;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      canchas: {
        Row: {
          id: string;
          sede_id: string;
          nombre: string;
          tipo_superficie: 'grass_natural' | 'grass_sintetico' | 'cemento';
          capacidad: '5v5' | '6v6' | '5v5_6v6';
          precio_hora: number;
          precio_dia: number | null;
          precio_noche: number | null;
          horario_dia_inicio: string | null;
          horario_dia_fin: string | null;
          horario_noche_inicio: string | null;
          horario_noche_fin: string | null;
          largo_metros: number | null;
          ancho_metros: number | null;
          tiene_iluminacion: boolean;
          tiene_vestuarios: boolean;
          tiene_estacionamiento: boolean;
          foto_url: string | null;
          activo: boolean;
          aprobado: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sede_id: string;
          nombre: string;
          tipo_superficie: 'grass_natural' | 'grass_sintetico' | 'cemento';
          capacidad: '5v5' | '6v6' | '5v5_6v6';
          precio_hora: number;
          precio_dia?: number | null;
          precio_noche?: number | null;
          horario_dia_inicio?: string | null;
          horario_dia_fin?: string | null;
          horario_noche_inicio?: string | null;
          horario_noche_fin?: string | null;
          largo_metros?: number | null;
          ancho_metros?: number | null;
          tiene_iluminacion?: boolean;
          tiene_vestuarios?: boolean;
          tiene_estacionamiento?: boolean;
          foto_url?: string | null;
          activo?: boolean;
          aprobado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sede_id?: string;
          nombre?: string;
          tipo_superficie?: 'grass_natural' | 'grass_sintetico' | 'cemento';
          capacidad?: '5v5' | '6v6' | '5v5_6v6';
          precio_hora?: number;
          precio_dia?: number | null;
          precio_noche?: number | null;
          horario_dia_inicio?: string | null;
          horario_dia_fin?: string | null;
          horario_noche_inicio?: string | null;
          horario_noche_fin?: string | null;
          largo_metros?: number | null;
          ancho_metros?: number | null;
          tiene_iluminacion?: boolean;
          tiene_vestuarios?: boolean;
          tiene_estacionamiento?: boolean;
          foto_url?: string | null;
          activo?: boolean;
          aprobado?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      horarios: {
        Row: {
          id: string;
          cancha_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fin: string;
          disponible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          cancha_id: string;
          dia_semana: number;
          hora_inicio: string;
          hora_fin: string;
          disponible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          cancha_id?: string;
          dia_semana?: number;
          hora_inicio?: string;
          hora_fin?: string;
          disponible?: boolean;
          created_at?: string;
        };
      };
      partidos: {
        Row: {
          id: string;
          cancha_id: string;
          creador_id: string;
          formato: '5v5' | '6v6';
          tipo: 'publico' | 'privado' | 'reserva';
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          max_jugadores: number;
          jugadores_confirmados: number;
          precio_por_jugador: number;
          estado: 'abierto' | 'lleno' | 'en_curso' | 'finalizado' | 'cancelado' | 'reservado';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cancha_id: string;
          creador_id: string;
          formato: '5v5' | '6v6';
          tipo?: 'publico' | 'privado' | 'reserva';
          fecha: string;
          hora_inicio: string;
          hora_fin: string;
          max_jugadores: number;
          jugadores_confirmados?: number;
          precio_por_jugador: number;
          estado?: 'abierto' | 'lleno' | 'en_curso' | 'finalizado' | 'cancelado' | 'reservado';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cancha_id?: string;
          creador_id?: string;
          formato?: '5v5' | '6v6';
          tipo?: 'publico' | 'privado' | 'reserva';
          fecha?: string;
          hora_inicio?: string;
          hora_fin?: string;
          max_jugadores?: number;
          jugadores_confirmados?: number;
          precio_por_jugador?: number;
          estado?: 'abierto' | 'lleno' | 'en_curso' | 'finalizado' | 'cancelado' | 'reservado';
          created_at?: string;
          updated_at?: string;
        };
      };
      jugadores_partido: {
        Row: {
          id: string;
          partido_id: string;
          jugador_id: string;
          equipo: 'equipo_a' | 'equipo_b' | null;
          estado: 'confirmado' | 'pendiente' | 'cancelado';
          goles: number;
          asistencias: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          partido_id: string;
          jugador_id: string;
          equipo?: 'equipo_a' | 'equipo_b' | null;
          estado?: 'confirmado' | 'pendiente' | 'cancelado';
          goles?: number;
          asistencias?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          partido_id?: string;
          jugador_id?: string;
          equipo?: 'equipo_a' | 'equipo_b' | null;
          estado?: 'confirmado' | 'pendiente' | 'cancelado';
          goles?: number;
          asistencias?: number;
          created_at?: string;
        };
      };
      transacciones: {
        Row: {
          id: string;
          partido_id: string;
          jugador_id: string;
          monto_total: number;
          comision_plataforma: number;
          monto_dueno: number;
          metodo_pago: 'yape' | 'plin' | 'tarjeta' | 'efectivo' | 'mercadopago' | 'culqi';
          estado_pago: 'pendiente' | 'pagado' | 'reembolsado' | 'fallido';
          referencia_pago: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partido_id: string;
          jugador_id: string;
          monto_total: number;
          comision_plataforma: number;
          monto_dueno: number;
          metodo_pago: 'yape' | 'plin' | 'tarjeta' | 'efectivo' | 'mercadopago' | 'culqi';
          estado_pago?: 'pendiente' | 'pagado' | 'reembolsado' | 'fallido';
          referencia_pago?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partido_id?: string;
          jugador_id?: string;
          monto_total?: number;
          comision_plataforma?: number;
          monto_dueno?: number;
          metodo_pago?: 'yape' | 'plin' | 'tarjeta' | 'efectivo' | 'mercadopago' | 'culqi';
          estado_pago?: 'pendiente' | 'pagado' | 'reembolsado' | 'fallido';
          referencia_pago?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      configuracion: {
        Row: {
          id: string;
          clave: string;
          valor: string;
          descripcion: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clave: string;
          valor: string;
          descripcion?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clave?: string;
          valor?: string;
          descripcion?: string | null;
          updated_at?: string;
        };
      };
      notificaciones: {
        Row: {
          id: string;
          perfil_id: string;
          titulo: string;
          mensaje: string;
          tipo: 'invitacion' | 'confirmacion' | 'pago' | 'recordatorio' | 'sistema';
          leida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          titulo: string;
          mensaje: string;
          tipo: 'invitacion' | 'confirmacion' | 'pago' | 'recordatorio' | 'sistema';
          leida?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          perfil_id?: string;
          titulo?: string;
          mensaje?: string;
          tipo?: 'invitacion' | 'confirmacion' | 'pago' | 'recordatorio' | 'sistema';
          leida?: boolean;
          created_at?: string;
        };
      };
      mensajes_partido: {
        Row: {
          id: string;
          partido_id: string;
          perfil_id: string;
          mensaje: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          partido_id: string;
          perfil_id: string;
          mensaje: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          partido_id?: string;
          perfil_id?: string;
          mensaje?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type Perfil = Database['public']['Tables']['perfiles']['Row'];
export type Jugador = Database['public']['Tables']['jugadores']['Row'];
export type Dueno = Database['public']['Tables']['duenos']['Row'];
export type Sede = Database['public']['Tables']['sedes']['Row'];
export type Cancha = Database['public']['Tables']['canchas']['Row'];
export type Horario = Database['public']['Tables']['horarios']['Row'];
export type Partido = Database['public']['Tables']['partidos']['Row'];
export type JugadorPartido = Database['public']['Tables']['jugadores_partido']['Row'];
export type Transaccion = Database['public']['Tables']['transacciones']['Row'];
export type Notificacion = Database['public']['Tables']['notificaciones']['Row'];
export type MensajePartido = Database['public']['Tables']['mensajes_partido']['Row'];
