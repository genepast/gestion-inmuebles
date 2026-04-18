# CLAUDE.md — Sistema de Gestión de Inmuebles

Prueba técnica Full-Stack (Semi-Senior / Senior). Duración estimada: 5–7 días.
Stack: Next.js 14+ · TypeScript strict · Supabase · TailwindCSS.

---

## Stack obligatorio

| Tecnología | Uso |
|---|---|
| Next.js 14+ App Router | Base del proyecto. **Sin Pages Router.** |
| TypeScript strict | Sin `any` sin justificación explícita. Sin `@ts-ignore`. |
| Supabase | Postgres + Auth + Storage + RLS |
| TailwindCSS | Estilos. Sin CSS-in-JS alternativo. |
| React Hook Form + Zod | Formularios y validación. |
| TanStack Query (React Query) | Fetching, caché y sincronización de estado servidor. |

**Recomendado (suma puntos):** shadcn/ui · Vitest + React Testing Library · ESLint + Prettier · Husky + lint-staged.

**Prohibido:** Pages Router · Redux · `useEffect` para fetching donde corresponde RSC o React Query.

---

## Restricciones críticas (red flags que penalizan fuerte)

1. **Nunca subir `service_role` key** al repo ni exponerla al cliente. Solo en Route Handlers / Server Actions.
2. **RLS obligatoria en todas las tablas.** Nunca `USING (true)` sin restricciones.
3. **Nunca hardcodear credenciales** de Supabase. Usar variables de entorno documentadas en `.env.example`.
4. **Validación server-side siempre.** La validación de cliente es solo UX.
5. **Sin N+1 queries** en el listado — usar joins o selects eficientes.
6. **Paginación server-side** (no traer todo y paginar en cliente).
7. **Transiciones de estado inválidas** deben rechazarse en backend, no solo en UI.

---

## Arquitectura

### Capas (UI → aplicación → datos → integración externa)

```
UI (Server/Client Components)
  └─ hooks / services          # lógica de aplicación
       └─ repositories         # acceso a DB (Supabase)
            └─ adapters/mappers # integración API externa → DTO interno
```

- **Server Components por defecto.** Client Components solo cuando hay interactividad o hooks de estado.
- **Route Handlers** (`app/api/...`) para endpoints propios. No exponer Supabase directamente al cliente.
- **Feature-first:** cada feature agrupa sus componentes, hooks, services, repositories, schemas y types.

### Patrón Adapter/Mapper (obligatorio para API externa)

La API externa **nunca debe acoplarse** a la DB ni a la UI.
`lib/external-api/mappers.ts` normaliza cualquier campo externo al DTO interno `ExternalPropertyDTO`.

Ejemplo: la API devuelve `beds` / `baths` → el mapper traduce a `bedrooms` / `bathrooms`.

---

## Estructura de carpetas esperada

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard con métricas
│   │   ├── properties/
│   │   │   ├── page.tsx          # Listado paginado
│   │   │   ├── new/page.tsx      # Alta
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Detalle
│   │   │       └── edit/page.tsx
│   │   └── settings/
│   ├── api/
│   │   ├── sync/properties/route.ts
│   │   └── properties/export/route.ts
│   └── layout.tsx
│
├── features/                     # feature-first
│   ├── properties/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/             # lógica de negocio
│   │   ├── repositories/         # acceso a DB
│   │   ├── schemas/              # Zod schemas
│   │   └── types.ts
│   ├── auth/
│   └── dashboard/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (anon key)
│   │   ├── server.ts             # Server client con cookies
│   │   └── admin.ts              # service_role (solo server)
│   ├── external-api/
│   │   ├── client.ts
│   │   ├── mappers.ts            # Adapter → ExternalPropertyDTO
│   │   └── types.ts
│   └── utils/
│
├── components/
│   └── ui/                       # shadcn
│
├── middleware.ts                  # Protección de rutas por rol
└── tests/
    ├── unit/
    └── integration/
```

---

## Modelo de datos (tablas Supabase)

### `properties`
Columnas clave: `id`, `external_id` (unique), `source` ('manual'|'external'), `title`, `description`, `operation_type` ('sale'|'rent'|'temporary_rent'), `property_type`, `status` (default 'draft'), `price_amount`, `price_currency`, `bedrooms`, `bathrooms`, `total_area_m2`, `covered_area_m2`, `parking_spaces`, `country`, `province`, `city`, `neighborhood`, `address`, `latitude`, `longitude`, `has_pool`, `has_garden`, `has_balcony`, `assigned_agent_id`, `created_by`, `created_at`, `updated_at`.

### `property_images`
`id`, `property_id` (FK cascade), `storage_path`, `position`, `is_primary`, `created_at`.

### `property_status_history` (auditoría)
`id`, `property_id` (FK cascade), `from_status`, `to_status`, `changed_by`, `reason`, `changed_at`.

### `profiles`
`id` (FK auth.users cascade), `full_name`, `role` ('admin'|'agent'|'viewer', default 'viewer'), `created_at`.

### `sync_logs`
`id`, `started_at`, `finished_at`, `status` ('running'|'success'|'error'), `items_created`, `items_updated`, `error_message`.

**Índices requeridos en `properties`:** `price_amount`, `city`, `property_type`, `bedrooms`, `status`.
**Full-text search:** `tsvector` sobre `title` y `description`.

---

## Políticas RLS mínimas

| Rol | SELECT | INSERT | UPDATE / DELETE |
|---|---|---|---|
| viewer | Solo `status` IN (available, reserved, sold, rented) | ✗ | ✗ |
| agent | Completo | ✓ | Solo si `assigned_agent_id = auth.uid()` |
| admin | Completo | ✓ | Cualquier propiedad |

El rol se lee del JWT claim `role` o de la tabla `profiles`.

---

## Ciclo de vida comercial

```
draft → available → reserved → sold
                             → rented
                             → cancelled
```

- Las transiciones inválidas (ej. `sold → available`) se rechazan **en backend** con mensaje claro.
- Cada cambio genera un registro en `property_status_history`.
- Agent: solo modifica propiedades asignadas a él. Admin: cualquiera.

---

## Sincronización con API externa

- Endpoint: `POST /api/sync/properties`
- **Idempotente:** si `externalId` ya existe → UPDATE; si no → CREATE.
- `source = 'external'` para propiedades sincronizadas.
- Manejo de rate limits con **backoff exponencial** o cola.
- Registrar cada ejecución en `sync_logs`.
- Si falla la API, UI muestra error + último sync exitoso.

API externa de referencia: `https://api.sampleapis.com/rentals/rentals`

### DTO interno (`lib/external-api/types.ts`)
```typescript
export interface ExternalPropertyDTO {
  externalId: string;
  title: string;
  description: string;
  operationType: 'sale' | 'rent' | 'temporary_rent';
  propertyType: 'apartment' | 'house' | 'ph' | 'land' | 'commercial' | 'office';
  price: { amount: number; currency: 'USD' | 'ARS' | 'EUR' };
  location: {
    country: string; province: string; city: string;
    neighborhood?: string; address?: string;
    latitude?: number; longitude?: number;
  };
  attributes: {
    bedrooms: number; bathrooms: number;
    totalAreaM2: number; coveredAreaM2: number;
    parkingSpaces: number; yearBuilt?: number;
    hasPool: boolean; hasGarden: boolean; hasBalcony: boolean;
  };
  images: string[];
  publishedAt: string; // ISO 8601
}
```

---

## Convenciones de código

- **Naming:** `camelCase` para variables/funciones, `PascalCase` para componentes y tipos, `snake_case` para columnas DB y variables de entorno.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, etc.), atómicos y con mensaje claro.
- **Sin comentarios obvios.** Solo comentar el *por qué* cuando no es evidente.
- **Sin `any`.** Tipar siempre; si es inevitable, justificar con comentario.
- **React Query** para todo fetching en Client Components. Sin `useEffect` para fetching.
- **Server Components** por defecto; `'use client'` solo cuando se necesite interactividad.
- **Zod** para validar tanto en cliente (UX) como en servidor (seguridad).
- **`next/image`** para todas las imágenes.
- `staleTime` apropiado en React Query según el tipo de dato.
- **Sin explicaciones innecesarias.** No expliques el código que escribís
  salvo que se te pida explícitamente.

---

## Seguridad

- `anon key` solo en el cliente (browser). `service_role` solo en servidor.
- CSP headers básicos en `next.config.js`.
- Rate limiting en `/api/sync/properties` y mutaciones sensibles (Upstash Redis o similar).
- Sanitizar inputs de texto libre antes de persistir.
- `.env.example` completo sin valores reales. Verificar que el historial de git no contenga secrets.

---

## Criterios de evaluación (pesos)

| Dimensión | Peso |
|---|---|
| Arquitectura y diseño | 20% |
| Calidad de código | 15% |
| Seguridad | 15% |
| Integración externa | 10% |
| UX/UI | 10% |
| Performance | 10% |
| Testing | 10% |
| Documentación | 5% |
| Git hygiene | 5% |

Puntaje mínimo para avanzar: **60/100**.

### Bonus (no obligatorio)
i18n · modo oscuro · Supabase Realtime · PDF de ficha · CI con GitHub Actions · Storybook · recomendador de propiedades similares.

---

## Checklist antes de entregar

**Funcional**
- [ ] Register / login / logout sin errores
- [ ] Viewer no puede editar (UI + backend)
- [ ] Filtros persisten en URL y se restauran al recargar
- [ ] Crear propiedad con imágenes y verla en listado
- [ ] Sync ejecuta y deja trazas en `sync_logs`
- [ ] Transición inválida de estado se rechaza con mensaje claro

**Técnico**
- [ ] `npm run build` sin warnings
- [ ] `npm run typecheck` limpio
- [ ] `npm run lint` limpio
- [ ] `npm test` pasa
- [ ] `.env.example` completo, sin secrets en historial git
- [ ] RLS activa en todas las tablas (verificado en Supabase dashboard)

**Deploy**
- [ ] URL pública carga sin errores (Vercel o similar)
- [ ] 3 usuarios de prueba creados (uno por rol) con credenciales en README
- [ ] Al menos 15 propiedades seed (manual + sincronizadas)
- [ ] Imágenes cargan desde Supabase Storage

**Testing mínimo**
- [ ] Al menos 1 test de integración de flujo crítico (ej. crear propiedad end-to-end)
- [ ] Al menos 3 tests unitarios de utilidades / mappers / validadores


## Gestión de tareas
Antes de implementar cualquier tarea, revisá `TASKS.md` para entender
qué está completado y qué sigue.
Al terminar cada tarea, actualizá `TASKS.md` moviendo la tarea
correspondiente a ✅ Completado, antes de que yo haga el commit.