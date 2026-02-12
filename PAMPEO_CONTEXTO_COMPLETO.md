# 🏟️ PAMPEO — Documentación Completa del Proyecto

## Resumen del Proyecto

**Pampeo** es una plataforma para organizar encuentros deportivos de fútbol (5v5 y 6v6). Conecta jugadores con canchas de fútbol y permite a los dueños de canchas gestionar sus sedes y reservas. El administrador de la plataforma cobra una comisión por cada partido realizado.

---

## Arquitectura General

```
📱 App Móvil (pampeo-app)        → Jugadores y Dueños de Cancha
💻 Panel Web Admin (pampeo-admin) → Administrador (Super Admin)
🗄️ Supabase                      → Base de datos compartida (PostgreSQL)
```

Ambas aplicaciones se conectan a la **misma base de datos en Supabase**. La app móvil usa la `anon key` con RLS, el panel admin usa `service_role key` desde el servidor.

---

## 3 Roles del Sistema

| Rol | Plataforma | Descripción |
|-----|-----------|-------------|
| **Jugador** | App Móvil | Se registra, busca canchas en mapa, se une a partidos, paga, ve estadísticas |
| **Dueño de Cancha** | App Móvil | Registra canchas, gestiona horarios, ve reservas e ingresos |
| **Administrador** | Panel Web (PC) | Dashboard completo: métricas, transacciones, comisiones, gestión de usuarios y canchas |

---

## Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage (fotos de canchas y perfiles) |
| Realtime | Supabase Realtime (partidos, transacciones, notificaciones) |
| Panel Web Admin | Next.js + TypeScript + Tailwind CSS |
| App Móvil | React Native o Flutter (por definir) |
| Hosting Web | Vercel |
| Mapas | Google Maps API |
| Pagos | Culqi o MercadoPago (por implementar) |

---

## Estructura de Carpetas

```
C:\Users\FRANZ\Documents\GitHub\Pampeo\
├── 📁 pampeo-admin\          ← Panel Web Admin (Next.js + Vercel)
│     ├── .env.local
│     └── README.md
│
└── 📁 pampeo-app\            ← App Móvil (React Native o Flutter)
      ├── .env
      └── README.md
```

Cada carpeta es un **repositorio independiente en GitHub**:
- `github.com/tu-usuario/pampeo-admin`
- `github.com/tu-usuario/pampeo-app`

---

## Supabase — Configuración

### Proyecto
- **Nombre:** Pampeo
- **URL:** `https://bujvhryibtskedcyomfk.supabase.co`
- **Región:** Americas
- **RLS Automático:** Activado

### Variables de Entorno

#### pampeo-admin/.env.local
```
NEXT_PUBLIC_SUPABASE_URL=https://bujvhryibtskedcyomfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Publishable key / anon public]
SUPABASE_SERVICE_ROLE_KEY=[Secret key / service_role secret]
```

#### pampeo-app/.env
```
SUPABASE_URL=https://bujvhryibtskedcyomfk.supabase.co
SUPABASE_ANON_KEY=[Publishable key / anon public]
```

> ⚠️ La app móvil NUNCA debe tener la service_role key.

### Cómo se usan las keys

```
🌐 Cliente (navegador / app móvil)
   → ANON KEY → RLS activo, filtra datos por usuario

🖥️ Servidor (API routes de Next.js en Vercel)
   → SERVICE_ROLE KEY → Salta RLS, acceso total para admin
```

---

## Auth — Configuración

| Método | Estado |
|--------|--------|
| Email + contraseña | ✅ Configurado y probado |
| Google OAuth | ✅ Configurado en Google Cloud + Supabase |
| Teléfono (SMS) | ❌ Descartado por ahora |

### Google OAuth
- Proyecto en Google Cloud: **Pampeo**
- Tipo de usuario: **Externo**
- URI de redirección: `https://bujvhryibtskedcyomfk.supabase.co/auth/v1/callback`
- Client ID y Client Secret configurados en Supabase → Authentication → Providers → Google

### Trigger Automático
Al registrarse un usuario (por email o Google), se crea automáticamente un registro en la tabla `perfiles` con rol `jugador` por defecto. Esto se verificó creando el usuario `test@pampeo.com`.

---

## Base de Datos — Esquema Completo

### Tablas (12 total)

#### 1. perfiles (usuarios base)
```sql
- id UUID (PK, referencia a auth.users)
- email TEXT
- nombre_completo TEXT
- telefono TEXT
- avatar_url TEXT
- rol TEXT ('jugador', 'dueno', 'admin')
- activo BOOLEAN
- created_at, updated_at TIMESTAMPTZ
```

#### 2. jugadores (perfil deportivo)
```sql
- id UUID (PK)
- perfil_id UUID (FK → perfiles, UNIQUE)
- apodo TEXT
- posicion TEXT ('arquero', 'defensa', 'mediocampista', 'delantero')
- nivel TEXT ('principiante', 'intermedio', 'avanzado')
- zona_preferida TEXT
- partidos_jugados, goles, asistencias, partidos_ganados INT
- created_at, updated_at TIMESTAMPTZ
```

#### 3. duenos (dueños de cancha)
```sql
- id UUID (PK)
- perfil_id UUID (FK → perfiles, UNIQUE)
- dni, ruc TEXT
- banco, cuenta_bancaria TEXT
- verificado BOOLEAN
- created_at, updated_at TIMESTAMPTZ
```

#### 4. sedes
```sql
- id UUID (PK)
- dueno_id UUID (FK → duenos)
- nombre, direccion, distrito, ciudad, departamento TEXT
- latitud DECIMAL(10,8), longitud DECIMAL(11,8)
- telefono_contacto TEXT
- activo BOOLEAN
- created_at, updated_at TIMESTAMPTZ
```

#### 5. canchas
```sql
- id UUID (PK)
- sede_id UUID (FK → sedes)
- nombre TEXT
- tipo_superficie TEXT ('grass_natural', 'grass_sintetico', 'cemento')
- capacidad TEXT ('5v5', '6v6', '5v5_6v6')
- precio_hora DECIMAL(10,2)
- largo_metros, ancho_metros DECIMAL(5,2)
- tiene_iluminacion, tiene_vestuarios, tiene_estacionamiento BOOLEAN
- foto_url TEXT
- activo, aprobado BOOLEAN
- created_at, updated_at TIMESTAMPTZ
```

#### 6. horarios
```sql
- id UUID (PK)
- cancha_id UUID (FK → canchas)
- dia_semana INT (0=Lunes, 6=Domingo)
- hora_inicio, hora_fin TIME
- disponible BOOLEAN
- created_at TIMESTAMPTZ
```

#### 7. partidos
```sql
- id UUID (PK)
- cancha_id UUID (FK → canchas)
- creador_id UUID (FK → perfiles)
- formato TEXT ('5v5', '6v6')
- tipo TEXT ('publico', 'privado')
- fecha DATE
- hora_inicio, hora_fin TIME
- max_jugadores INT
- jugadores_confirmados INT
- precio_por_jugador DECIMAL(10,2)
- estado TEXT ('abierto', 'lleno', 'en_curso', 'finalizado', 'cancelado')
- created_at, updated_at TIMESTAMPTZ
```

#### 8. jugadores_partido
```sql
- id UUID (PK)
- partido_id UUID (FK → partidos)
- jugador_id UUID (FK → jugadores)
- equipo TEXT ('equipo_a', 'equipo_b')
- estado TEXT ('confirmado', 'pendiente', 'cancelado')
- goles, asistencias INT
- created_at TIMESTAMPTZ
- UNIQUE(partido_id, jugador_id)
```

#### 9. transacciones
```sql
- id UUID (PK)
- partido_id UUID (FK → partidos)
- jugador_id UUID (FK → jugadores)
- monto_total DECIMAL(10,2)
- comision_plataforma DECIMAL(10,2)
- monto_dueno DECIMAL(10,2)
- metodo_pago TEXT ('yape', 'plin', 'tarjeta', 'efectivo', 'mercadopago', 'culqi')
- estado_pago TEXT ('pendiente', 'pagado', 'reembolsado', 'fallido')
- referencia_pago TEXT
- created_at, updated_at TIMESTAMPTZ
```

#### 10. configuracion
```sql
- id UUID (PK)
- clave TEXT (UNIQUE)
- valor TEXT
- descripcion TEXT
- updated_at TIMESTAMPTZ
```

Valores iniciales:
- `comision_por_partido` = `1.00` (S/ 1 por partido)
- `comision_tipo` = `fijo`
- `app_nombre` = `Pampeo`
- `app_version` = `1.0.0`

#### 11. notificaciones
```sql
- id UUID (PK)
- perfil_id UUID (FK → perfiles)
- titulo, mensaje TEXT
- tipo TEXT ('invitacion', 'confirmacion', 'pago', 'recordatorio', 'sistema')
- leida BOOLEAN
- created_at TIMESTAMPTZ
```

#### 12. mensajes_partido (chat de partido)
```sql
- id UUID (PK)
- partido_id UUID (FK → partidos)
- perfil_id UUID (FK → perfiles)
- mensaje TEXT
- created_at TIMESTAMPTZ
```

### Relaciones
```
perfiles ──→ jugadores (1:1)
perfiles ──→ duenos (1:1)
duenos ──→ sedes (1:N)
sedes ──→ canchas (1:N)
canchas ──→ horarios (1:N)
canchas ──→ partidos (1:N)
perfiles ──→ partidos (1:N, como creador)
partidos ──→ jugadores_partido (1:N)
jugadores ──→ jugadores_partido (1:N)
partidos ──→ transacciones (1:N)
jugadores ──→ transacciones (1:N)
perfiles ──→ notificaciones (1:N)
partidos ──→ mensajes_partido (1:N)
```

### Índices (13)
```
idx_jugadores_perfil, idx_duenos_perfil, idx_sedes_dueno,
idx_canchas_sede, idx_partidos_cancha, idx_partidos_fecha,
idx_partidos_estado, idx_jugadores_partido_partido,
idx_transacciones_partido, idx_transacciones_estado,
idx_transacciones_fecha, idx_notificaciones_perfil,
idx_mensajes_partido
```

### RLS — Políticas (22 total)
Todas las tablas tienen RLS activado. Resumen:
- **Jugadores** solo ven/editan sus propios datos
- **Dueños** solo gestionan sus sedes y canchas
- **Todos los autenticados** pueden ver canchas, partidos públicos, y jugadores
- **Admin** accede a todo via `service_role` key (salta RLS)
- **Configuración** solo modificable por admin desde backend

### Realtime
Activado en 5 tablas:
- `partidos`
- `jugadores_partido`
- `transacciones`
- `notificaciones`
- `mensajes_partido`

### Triggers (8)
- `set_updated_at` en: perfiles, jugadores, duenos, sedes, canchas, partidos, transacciones
- `on_auth_user_created`: Crea perfil automáticamente al registrarse

---

## Modelo de Negocio

### Flujo del dinero
```
Partido 5v5 → Cancha cobra S/80 la hora
→ Cada jugador paga S/8
→ De esos S/80: tú te quedas S/1 (comisión) → Dueño recibe S/79
```

### Comisión configurable
La comisión se guarda en la tabla `configuracion` con clave `comision_por_partido`. Se puede cambiar sin tocar código desde el panel admin.

---

## Panel Web Admin — Pantallas

El panel admin tiene 7 pantallas principales:

| # | Pantalla | Descripción | Tablas involucradas |
|---|----------|-------------|-------------------|
| 1 | **Dashboard** | Resumen general, gráfico de comisiones, últimas transacciones | Todas |
| 2 | **Transacciones** | Todos los pagos, filtros por estado, tu comisión vs pago al dueño | `transacciones` |
| 3 | **Partidos** | Partidos abiertos, llenos, en curso, finalizados | `partidos + jugadores_partido` |
| 4 | **Canchas** | Listado de canchas con botón de aprobar nuevas | `canchas + sedes` |
| 5 | **Jugadores** | Todos los jugadores, nivel, goles, estado | `perfiles + jugadores` |
| 6 | **Dueños** | Dueños, sus canchas, verificación, ingresos | `perfiles + duenos` |
| 7 | **Configuración** | Cambiar comisión, nombre de app, versión | `configuracion` |

### Stack del Panel Admin
- **Framework:** Next.js (App Router) + TypeScript
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel
- **Supabase client:** `@supabase/supabase-js` + `@supabase/ssr`
- **Gráficos:** Recharts (para dashboard)

---

## App Móvil — Funcionalidades

### Para Jugadores
- Registro e inicio de sesión (email / Google)
- Mapa interactivo con canchas cercanas (Google Maps)
- Buscar y filtrar canchas por ubicación, precio, tipo, disponibilidad
- Crear partidos (público o privado)
- Unirse a partidos existentes
- Chat grupal por partido
- División automática de equipos
- Pago integrado (Yape, Plin, tarjeta, efectivo)
- Perfil con estadísticas (goles, asistencias, partidos)
- Notificaciones (invitaciones, confirmaciones, recordatorios)

### Para Dueños de Cancha
- Registrar sedes y canchas
- Gestionar horarios disponibles
- Ver reservas en sus canchas
- Ver ingresos y pagos recibidos
- Contacto con jugadores

---

## Estado Actual del Proyecto

| Paso | Tarea | Estado |
|------|-------|--------|
| 1 | Base de datos (Supabase) | ✅ Completado |
| 2 | Auth (Email + Google) | ✅ Completado |
| 3 | Panel Web Admin (Next.js) | ⏳ Siguiente paso |
| 4 | App Móvil | 🔜 Pendiente |
| 5 | Pasarela de Pagos | 🔜 Pendiente |
| 6 | Google Maps | 🔜 Pendiente |

### Próximo paso inmediato
Crear el proyecto Next.js en `pampeo-admin/`:
```bash
cd C:\Users\FRANZ\Documents\GitHub\Pampeo\pampeo-admin
npx create-next-app@latest . --typescript --tailwind --app --eslint
```

Luego configurar la conexión con Supabase e implementar las 7 pantallas del panel admin.

---

## Notas Importantes

1. **RLS + service_role:** El panel admin usa `service_role` key desde las API routes de Next.js (server-side). Esto salta el RLS y permite ver todos los datos. La app móvil usa `anon key` con RLS activo.

2. **Ubicación del proyecto:** Jauja, Junín, Perú. Las coordenadas y moneda (Soles S/) son para Perú.

3. **Comisión:** Actualmente fija en S/1 por partido. Configurable desde tabla `configuracion`.

4. **Realtime:** Cuando un jugador paga desde la app móvil, el admin ve la transacción aparecer instantáneamente en su panel web.

5. **Aprobación de canchas:** Las canchas nuevas tienen `aprobado = false`. El admin debe aprobarlas desde el panel web antes de que aparezcan en la app.
