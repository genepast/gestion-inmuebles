# SPEC — Prueba Técnica “Gestión de Inmuebles”

Este documento es la **Guía de Verdad** del proyecto. Si algo entra en conflicto con discusiones posteriores, **manda este SPEC** (salvo que decidamos explícitamente cambiarlo y registrar el cambio).

Fuente: `Prueba-Tecnica-Gestion-Inmuebles.pdf`.

---

## 1) Stack Técnico Obligatorio (y prohibiciones)

### Obligatorio
- **Next.js**: **14+** con **App Router** (Server Components por defecto).
- **TypeScript**: `strict` habilitado. **Nada de `any`** salvo justificación explícita.
- **Supabase**: **Postgres + Auth + Storage**.
- **TailwindCSS**: estilos.
- **Formularios/validación**: **React Hook Form + Zod**.
- **Estado servidor / fetching**: **TanStack Query (React Query)** para fetching, caché y sincronización.
- **Seguridad DB**: **RLS activa en todas las tablas**.

### Recomendado (suma)
- **UI accesible**: `shadcn/ui` o Radix UI.
- **Estado global cliente (si hiciera falta)**: Zustand o Jotai (opcional).
- **Testing**: Vitest + React Testing Library.
- **Calidad**: ESLint + Prettier; Husky + lint-staged (pre-commit).

### Prohibido / restricciones críticas
- **Pages Router** (debe ser App Router).
- **Redux** (overkill para el scope).
- **Exponer datos sensibles desde el cliente** sin pasar por **RLS** o sin mediación adecuada (Route Handlers/Server Actions).
- **Hardcodear credenciales** de Supabase en el repo.
- **Usar `service_role` en el cliente** (ver Seguridad).

---

## 2) Arquitectura (Anexo B + patrones)

### Principios de arquitectura esperados
- **Separación de capas**: UI → aplicación (hooks/services) → acceso a datos (repositories) → integración externa (adapters).
- **Server Components por defecto**; Client Components solo cuando se justifique (interactividad/hooks).
- **Endpoints propios** en **Route Handlers** (`app/api/...`).
- **Feature-first**: co-locar componentes, hooks, servicios, repositorios, schemas y tipos por feature.

### Patrón obligatorio: Adapter/Mapper para API externa
- La integración con la API externa **no puede acoplar** DB/UI al formato del proveedor.
- Debe existir una capa **Adapter/Mapper** que normalice a un **DTO interno** (ej. `ExternalPropertyDTO`).
- Ejemplo conceptual: si el proveedor devuelve `beds`/`habitaciones`, nuestro dominio usa `bedrooms`.

### Estructura de carpetas sugerida (Anexo B)
Referencia (no obligatoria, pero alineada con lo esperado):

```text
src/
├── app/                       # App Router
│   ├── (auth)/                # Rutas públicas
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/           # Rutas protegidas
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Dashboard
│   │   ├── properties/
│   │   │   ├── page.tsx       # Listado
│   │   │   ├── new/page.tsx   # Alta
│   │   │   └── [id]/
│   │   │       ├── page.tsx   # Detalle
│   │   │       └── edit/page.tsx
│   │   └── settings/
│   ├── api/
│   │   ├── sync/properties/route.ts
│   │   └── properties/export/route.ts
│   └── layout.tsx
│
├── features/                  # Organización feature-first
│   ├── properties/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/          # Lógica de negocio
│   │   ├── repositories/      # Acceso a DB
│   │   ├── schemas/           # Zod schemas
│   │   └── types.ts
│   ├── auth/
│   └── dashboard/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client (anon key)
│   │   ├── server.ts          # Server client con cookies
│   │   └── admin.ts           # service_role (solo server)
│   ├── external-api/
│   │   ├── client.ts
│   │   ├── mappers.ts         # Adapter a DTO interno
│   │   └── types.ts
│   └── utils/
│
├── components/
│   └── ui/                    # shadcn
│
├── middleware.ts              # Protección de rutas
└── tests/
    ├── unit/
    └── integration/
```

---

## 3) Seguridad crítica (RLS, keys, validación server-side)

### RLS (obligatoria)
- **RLS activa en todas las tablas**.
- El **frontend debe funcionar con `anon key`** (RLS debe ser suficiente).
- Evitar políticas “permisivas” tipo `USING (true)` sin restricciones (red flag).

#### Políticas mínimas esperadas (resumen)
- **viewer**:
  - `SELECT` solo para propiedades en estados comerciales visibles (ej. `available/reserved/sold/rented`).
  - **Sin** `INSERT/UPDATE/DELETE`.
- **agent**:
  - `SELECT` completo.
  - `INSERT` permitido.
  - `UPDATE/DELETE` **solo** si `assigned_agent_id = auth.uid()`.
- **admin**:
  - acceso total (por claim `role='admin'` en JWT o chequeo en `profiles`).

### Uso correcto de keys de Supabase
- **`anon` key**: permitida en cliente.
- **`service_role` key**: **solo servidor** (Route Handlers o Server Actions). **Nunca** al cliente ni al repo.

### Validación y autorización
- **Validación en cliente** = UX.
- **Validación en servidor** = seguridad. **Nunca confiar** en el cliente.
- Transiciones de estado inválidas deben rechazarse **en backend**.

### Endpoints sensibles y hardening
- **Rate limiting** en endpoints de sync y mutaciones sensibles (ej. Upstash Redis o similar).
- **Sanitización** de inputs (especialmente texto libre).
- **CSP headers** básicos en `next.config.js`.

---

## 4) Funcionalidades clave (lo que no puede fallar)

### 4.1 Autenticación y roles
- Auth con **email + password** vía Supabase Auth.
- **Magic link** (opcional, suma puntos).
- Roles: **admin / agent / viewer**.
- **Protección de rutas por rol** con `middleware.ts`.
- Al registrarse: rol por defecto **viewer**; solo admin puede promover.

### 4.2 Listado de propiedades (CRUD + query params)
- **Paginación server-side** (no traer todo y paginar en cliente).
- Filtros combinables: operación, tipo, rango de precio, dormitorios, baños, ciudad, estado comercial.
- **Búsqueda full-text** sobre `title` y `description` usando **`tsvector` en Postgres**.
- Orden: precio, fecha publicación, superficie.
- Vista tabla + alternativa grid.
- **URL shareable**: filtros en query params y restaurables al recargar.

### 4.3 Ciclo de vida comercial (reglas de negocio)
- Estados: `draft → available → reserved → (sold | rented | cancelled)`.
- **Transiciones inválidas**: se rechazan en backend con error claro.
- Auditoría: cada cambio crea registro con `usuario`, `timestamp` y `razón`.
- Autorización: agent modifica solo propiedades asignadas; admin modifica cualquiera.

### 4.4 Sincronización con API externa (idempotencia)
- Endpoint interno: `POST /api/sync/properties`.
- **Idempotente**:
  - si existe (mismo `externalId`) → **UPDATE**
  - si no existe → **CREATE**
- Marcar origen: `source = 'external' | 'manual'`.
- Manejo de rate limits: **backoff exponencial o cola**.
- Si falla la API externa: UI muestra error y **último sync exitoso**.
- Registrar ejecución en `sync_logs`.

---

## 5) Criterios de evaluación (qué suma puntos y qué evitar)

### Qué más puntúa (según pesos)
- **Arquitectura y diseño (20%)**: capas claras, patrones con criterio, decisiones justificadas.
- **Calidad de código (15%)**: legibilidad, naming, tipado, sin code smells, DRY sin sobre-abstract.
- **Seguridad (15%)**: RLS correcta, validación server-side, secrets bien gestionados, autorización.
- **Integración externa (10%)**: Adapter limpio, idempotencia, manejo de errores, sync resiliente.
- **UX/UI (10%)**: loading/error/empty states, responsive, accesibilidad básica.
- **Performance (10%)**: índices DB, caché, `next/image`, SSR/RSC con criterio.
- **Testing (10%)**: tests de lógica crítica (no tests frágiles de implementación).
- **Documentación (5%)**: README claro, onboarding reproducible, trade-offs.
- **Git hygiene (5%)**: commits atómicos, mensajes claros, repo limpio.

### Bonus (no obligatorio, suma)
- i18n (ej. `next-intl`), modo oscuro, realtime con Supabase Realtime, PDF de ficha, recomendador, CI con GitHub Actions, Storybook.

### Red Flags (penalizan fuerte)
- Subir/exponer **`service_role`** (al repo o al cliente).
- **RLS desactivada** o permisiva (`USING true` sin restricciones).
- Código copiado sin entender (se pregunta en entrevista).
- **N+1 queries** evidentes en el listado.
- Formularios sin **validación server-side**.
- `useEffect` para fetching cuando corresponde Server Components o React Query.

---

## Checklist mínimo antes de “considerar listo”
- Auth/register/login/logout sin errores.
- Viewer no puede editar (UI lo refleja **y** backend lo impide).
- Filtros persisten en URL y se restauran al recargar.
- Crear propiedad con imágenes (Storage) y verla en listado.
- Sync ejecuta y deja trazas en `sync_logs`.
- Transición inválida de estado se rechaza con mensaje claro.
- `npm run build` / `npm run typecheck` / `npm run lint` / `npm test` pasan.
- `.env.example` completo, sin secrets (incluye verificación de historial git cuando aplique).

