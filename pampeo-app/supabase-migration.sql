-- =============================================
-- PAMPEO - Migración completa para nueva DB
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. TABLA: perfiles
CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_completo TEXT,
  telefono TEXT,
  avatar_url TEXT,
  rol TEXT NOT NULL DEFAULT 'jugador' CHECK (rol IN ('jugador', 'dueno', 'admin')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLA: jugadores
CREATE TABLE IF NOT EXISTS public.jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  apodo TEXT,
  posicion TEXT CHECK (posicion IN ('arquero', 'defensa', 'mediocampista', 'delantero')),
  nivel TEXT CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')),
  zona_preferida TEXT,
  partidos_jugados INTEGER NOT NULL DEFAULT 0,
  goles INTEGER NOT NULL DEFAULT 0,
  asistencias INTEGER NOT NULL DEFAULT 0,
  partidos_ganados INTEGER NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLA: duenos
CREATE TABLE IF NOT EXISTS public.duenos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  dni TEXT,
  ruc TEXT,
  banco TEXT,
  cuenta_bancaria TEXT,
  verificado BOOLEAN NOT NULL DEFAULT false,
  numero_yape TEXT,
  nombre_yape TEXT,
  qr_yape_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA: sedes
CREATE TABLE IF NOT EXISTS public.sedes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dueno_id UUID NOT NULL REFERENCES public.duenos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  distrito TEXT,
  ciudad TEXT,
  departamento TEXT,
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  telefono_contacto TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLA: canchas
CREATE TABLE IF NOT EXISTS public.canchas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_superficie TEXT NOT NULL CHECK (tipo_superficie IN ('grass_natural', 'grass_sintetico', 'cemento')),
  capacidad TEXT NOT NULL CHECK (capacidad IN ('5v5', '6v6', '5v5_6v6')),
  precio_hora NUMERIC NOT NULL,
  precio_dia NUMERIC,
  precio_noche NUMERIC,
  horario_dia_inicio TIME,
  horario_dia_fin TIME,
  horario_noche_inicio TIME,
  horario_noche_fin TIME,
  largo_metros NUMERIC,
  ancho_metros NUMERIC,
  tiene_iluminacion BOOLEAN NOT NULL DEFAULT false,
  tiene_vestuarios BOOLEAN NOT NULL DEFAULT false,
  tiene_estacionamiento BOOLEAN NOT NULL DEFAULT false,
  foto_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  aprobado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLA: horarios
CREATE TABLE IF NOT EXISTS public.horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id UUID NOT NULL REFERENCES public.canchas(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA: partidos
CREATE TABLE IF NOT EXISTS public.partidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id UUID NOT NULL REFERENCES public.canchas(id) ON DELETE CASCADE,
  creador_id UUID NOT NULL REFERENCES public.perfiles(id),
  formato TEXT NOT NULL CHECK (formato IN ('5v5', '6v6')),
  tipo TEXT NOT NULL DEFAULT 'publico' CHECK (tipo IN ('publico', 'privado', 'reserva')),
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  max_jugadores INTEGER NOT NULL,
  jugadores_confirmados INTEGER NOT NULL DEFAULT 0,
  precio_por_jugador NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'lleno', 'en_curso', 'finalizado', 'cancelado', 'reservado', 'en_verificacion', 'rechazado')),
  comprobante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA: jugadores_partido
CREATE TABLE IF NOT EXISTS public.jugadores_partido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES public.jugadores(id) ON DELETE CASCADE,
  equipo TEXT CHECK (equipo IN ('equipo_a', 'equipo_b')),
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'pendiente', 'cancelado')),
  goles INTEGER NOT NULL DEFAULT 0,
  asistencias INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLA: transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES public.jugadores(id),
  monto_total NUMERIC NOT NULL,
  comision_plataforma NUMERIC NOT NULL,
  monto_dueno NUMERIC NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('yape', 'plin', 'tarjeta', 'efectivo', 'mercadopago', 'culqi')),
  estado_pago TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagado', 'reembolsado', 'fallido')),
  referencia_pago TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TABLA: configuracion
CREATE TABLE IF NOT EXISTS public.configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. TABLA: notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('invitacion', 'confirmacion', 'pago', 'recordatorio', 'sistema')),
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. TABLA: mensajes_partido
CREATE TABLE IF NOT EXISTS public.mensajes_partido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partido_id UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfiles(id),
  mensaje TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TRIGGER: Crear perfil + jugador/dueno automáticamente al registrarse
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_rol TEXT;
  new_perfil_id UUID;
BEGIN
  user_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'jugador');
  new_perfil_id := NEW.id;

  -- Crear perfil
  INSERT INTO public.perfiles (id, email, nombre_completo, telefono, rol)
  VALUES (
    new_perfil_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    NEW.raw_user_meta_data->>'telefono',
    user_rol
  );

  -- Si es jugador, crear registro en jugadores
  IF user_rol = 'jugador' THEN
    INSERT INTO public.jugadores (perfil_id, apodo, posicion)
    VALUES (
      new_perfil_id,
      NEW.raw_user_meta_data->>'apodo',
      NULLIF(NEW.raw_user_meta_data->>'posicion', '')
    );
  END IF;

  -- Si es dueño, crear registro en duenos
  IF user_rol = 'dueno' THEN
    INSERT INTO public.duenos (perfil_id)
    VALUES (new_perfil_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe y recrearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS (Row Level Security) - Políticas básicas
-- =============================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canchas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_partido ENABLE ROW LEVEL SECURITY;

-- Perfiles: usuarios autenticados pueden leer todos, actualizar el propio
CREATE POLICY "Perfiles: leer todos" ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Perfiles: actualizar propio" ON public.perfiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Perfiles: insertar propio" ON public.perfiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jugadores: leer todos, actualizar propio
CREATE POLICY "Jugadores: leer todos" ON public.jugadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Jugadores: actualizar propio" ON public.jugadores FOR UPDATE TO authenticated USING (perfil_id = auth.uid());
CREATE POLICY "Jugadores: insertar propio" ON public.jugadores FOR INSERT WITH CHECK (perfil_id = auth.uid());

-- Duenos: leer todos, actualizar propio
CREATE POLICY "Duenos: leer todos" ON public.duenos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Duenos: actualizar propio" ON public.duenos FOR UPDATE TO authenticated USING (perfil_id = auth.uid());
CREATE POLICY "Duenos: insertar propio" ON public.duenos FOR INSERT WITH CHECK (perfil_id = auth.uid());

-- Sedes: leer todos, insertar/actualizar dueño propio
CREATE POLICY "Sedes: leer todos" ON public.sedes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sedes: insertar dueno" ON public.sedes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sedes: actualizar dueno" ON public.sedes FOR UPDATE TO authenticated USING (true);

-- Canchas: leer todos, insertar/actualizar dueño
CREATE POLICY "Canchas: leer todos" ON public.canchas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Canchas: leer anonimo" ON public.canchas FOR SELECT TO anon USING (true);
CREATE POLICY "Canchas: insertar" ON public.canchas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Canchas: actualizar" ON public.canchas FOR UPDATE TO authenticated USING (true);

-- Horarios: leer todos, insertar/actualizar
CREATE POLICY "Horarios: leer todos" ON public.horarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Horarios: leer anonimo" ON public.horarios FOR SELECT TO anon USING (true);
CREATE POLICY "Horarios: insertar" ON public.horarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Horarios: actualizar" ON public.horarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Horarios: eliminar" ON public.horarios FOR DELETE TO authenticated USING (true);

-- Partidos: leer todos, insertar/actualizar autenticados
CREATE POLICY "Partidos: leer todos" ON public.partidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Partidos: insertar" ON public.partidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Partidos: actualizar" ON public.partidos FOR UPDATE TO authenticated USING (true);

-- Jugadores partido
CREATE POLICY "JugPartido: leer todos" ON public.jugadores_partido FOR SELECT TO authenticated USING (true);
CREATE POLICY "JugPartido: insertar" ON public.jugadores_partido FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "JugPartido: actualizar" ON public.jugadores_partido FOR UPDATE TO authenticated USING (true);

-- Transacciones
CREATE POLICY "Transacciones: leer todos" ON public.transacciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Transacciones: insertar" ON public.transacciones FOR INSERT TO authenticated WITH CHECK (true);

-- Configuracion
CREATE POLICY "Config: leer todos" ON public.configuracion FOR SELECT TO authenticated USING (true);

-- Notificaciones: leer propias, insertar autenticados
CREATE POLICY "Notificaciones: leer propias" ON public.notificaciones FOR SELECT TO authenticated USING (perfil_id = auth.uid());
CREATE POLICY "Notificaciones: insertar" ON public.notificaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Notificaciones: actualizar propias" ON public.notificaciones FOR UPDATE TO authenticated USING (perfil_id = auth.uid());

-- Mensajes partido
CREATE POLICY "Mensajes: leer todos" ON public.mensajes_partido FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mensajes: insertar" ON public.mensajes_partido FOR INSERT TO authenticated WITH CHECK (perfil_id = auth.uid());

-- =============================================
-- 13. TABLA: resenas (sistema de calificaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS public.resenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancha_id UUID NOT NULL REFERENCES public.canchas(id) ON DELETE CASCADE,
  jugador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  partido_id UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partido_id, jugador_id)
);

-- Campos cacheados en canchas para performance (evita AVG/COUNT en cada query)
ALTER TABLE public.canchas
  ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_resenas INTEGER DEFAULT 0;

-- Trigger: auto-actualizar promedio al insertar reseña
CREATE OR REPLACE FUNCTION update_cancha_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.canchas SET
    calificacion_promedio = (SELECT COALESCE(AVG(calificacion), 0) FROM public.resenas WHERE cancha_id = NEW.cancha_id),
    total_resenas = (SELECT COUNT(*) FROM public.resenas WHERE cancha_id = NEW.cancha_id)
  WHERE id = NEW.cancha_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_resena_created ON public.resenas;
CREATE TRIGGER on_resena_created
  AFTER INSERT ON public.resenas
  FOR EACH ROW EXECUTE FUNCTION update_cancha_rating();

-- RLS resenas
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resenas: leer todos" ON public.resenas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Resenas: leer anonimo" ON public.resenas FOR SELECT TO anon USING (true);
CREATE POLICY "Resenas: insertar propia" ON public.resenas FOR INSERT TO authenticated WITH CHECK (jugador_id = auth.uid());

-- =============================================
-- STORAGE: Crear buckets
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('canchas-fotos', 'canchas-fotos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('comprobantes-yape', 'comprobantes-yape', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Canchas fotos: leer publico" ON storage.objects FOR SELECT USING (bucket_id = 'canchas-fotos');
CREATE POLICY "Canchas fotos: upload auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'canchas-fotos');
CREATE POLICY "Comprobantes: leer publico" ON storage.objects FOR SELECT USING (bucket_id = 'comprobantes-yape');
CREATE POLICY "Comprobantes: upload auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'comprobantes-yape');
