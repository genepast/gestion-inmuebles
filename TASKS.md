# Tasks — Sistema de Gestión de Inmuebles

## ✅ Completado

### Fase 1: Setup e Infraestructura
- `chore: init next.js 14 project with strict quality standards and csp`
  - Next.js 14 con TypeScript strict, Tailwind, App Router y src/
  - Husky pre-commit con lint y typecheck
  - ESLint + Prettier con reglas estrictas (sin any)
  - CSP headers en next.config.js

- `feat(infra): folder structure and supabase configuration`
  - Estructura de carpetas según Anexo B
  - Clientes Supabase: client.ts, server.ts, admin.ts
  - Tipos TypeScript para tabla properties

### Fase 2: Seguridad y Autenticación
- `feat(auth): role-based middleware and profile synchronization`
  - Middleware src/middleware.ts con gestión de sesión
  - Protección de rutas por rol (admin, agent, viewer)
  - Redirección a /login para usuarios no autenticados

### Fase 3: Integración Externa (Patrón Adapter)
- `feat(sync): adapter pattern for external api and data normalization`
  - Patrón Adapter en src/lib/external-api/ (mappers.ts y types.ts)
  - Normalización de datos externos a ExternalPropertyDTO
  - Mapeo estricto de campos (beds -> bedrooms, baths -> bathrooms)

- `feat(api): idempotent synchronization endpoint with logging`
  - Route Handler POST /api/sync/properties
  - Lógica idempotente por external_id (upsert)
  - Registro en sync_logs (éxito y error)
  - Backoff exponencial ante fallos de API externa

### Fase 4: Dominio y Búsqueda
- `feat(db): full-text search implementation with tsvector`
  - Full-Text Search en properties (title y description) con tsvector
  - Índices en: price, city, property_type, bedrooms, status

- `feat(logic): commercial lifecycle validation and audit triggers`
  - Ciclo de vida en src/features/properties/services/status.service.ts
  - Transiciones válidas: draft -> available -> reserved -> (sold | rented | cancelled)
  - Registro en property_status_history con usuario, timestamp y razón

---

## ⏳ Pendiente

### Fase 5: Frontend y UI
- `feat(auth): login and register UI forms` ✅
  - Formulario de login en src/app/(auth)/login/page.tsx (email + password, Zod + RHF)
  - Formulario de registro en src/app/(auth)/register/page.tsx
  - Route Handler POST /api/auth/signout para cerrar sesión server-side
  - Botón de logout en el header del dashboard con email del usuario
  - Redirección post-login al dashboard (respeta ?next=), post-logout al login

- `feat(front): paginated grid/table views with url state and skeletons` ✅
  - Página src/app/(dashboard)/properties/page.tsx con TanStack Query
  - Paginación server-side y filtros combinables (precio, tipo, ciudad, estado)
  - Filtros sincronizados con URL Query Params
  - Skeletons para fetches > 300ms

- `feat(front): multi-step form with optimistic updates and storage` ✅
  - Formulario alta/edición con React Hook Form + Zod
  - Subida de múltiples imágenes a Supabase Storage con preview y reordenamiento
  - Optimistic Updates en el listado al editar

### Fase 6: Dashboard y Exportación
- `feat(dashboard): analytics view with income and distribution charts`
  - Dashboard en src/app/(dashboard)/page.tsx
  - Métricas: stock total, distribución por estado y tipo
  - Gráfico de ingresos por semana (últimos 3 meses) con Recharts o Nivo

- `feat(api): export filtered properties to csv`
  - Route Handler GET /api/properties/export
  - Exportación respeta filtros activos del listado

### Fase 7: Calidad y Entrega
- `test: integration flow for property creation and readme docs`
  - Configurar Vitest + React Testing Library
  - Test de integración: flujo completo de creación de propiedad
  - 3 tests unitarios para mappers y utilidades
  - README.md: stack, setup, diagrama ER y decisiones de diseño (Clean Architecture, RLS, Adapter)
