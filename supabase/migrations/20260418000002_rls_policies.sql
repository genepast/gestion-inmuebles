-- Habilitar RLS en todas las tablas
alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table property_status_history enable row level security;
alter table sync_logs enable row level security;

-- Función helper para obtener el rol del usuario autenticado.
-- SECURITY DEFINER para poder leer profiles sin importar sus propias políticas RLS.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- Políticas para 'profiles'
-- ============================================================

-- Cada usuario puede leer su propio perfil (necesario para que el middleware lea el rol)
create policy "users_read_own_profile"
  on profiles for select
  using (id = auth.uid());

-- ============================================================
-- Políticas para 'properties'
-- ============================================================

-- SELECT: viewer solo ve propiedades con estado público
create policy "prop_select_viewer"
  on properties for select
  using (
    public.current_user_role() = 'viewer'
    and status in ('available', 'reserved', 'sold', 'rented')
  );

-- SELECT: agent ve todo el stock
create policy "prop_select_agent"
  on properties for select
  using (public.current_user_role() = 'agent');

-- SELECT: admin ve todo el stock
create policy "prop_select_admin"
  on properties for select
  using (public.current_user_role() = 'admin');

-- INSERT: agent puede crear propiedades
create policy "prop_insert_agent"
  on properties for insert
  with check (public.current_user_role() = 'agent');

-- INSERT: admin puede crear propiedades
create policy "prop_insert_admin"
  on properties for insert
  with check (public.current_user_role() = 'admin');

-- UPDATE: agent solo actualiza las propiedades que tiene asignadas
create policy "prop_update_agent"
  on properties for update
  using (
    public.current_user_role() = 'agent'
    and assigned_agent_id = auth.uid()
  );

-- UPDATE: admin actualiza cualquier propiedad
create policy "prop_update_admin"
  on properties for update
  using (public.current_user_role() = 'admin');

-- DELETE: solo admin
create policy "prop_delete_admin"
  on properties for delete
  using (public.current_user_role() = 'admin');

-- ============================================================
-- Políticas para 'property_status_history'
-- ============================================================

-- SELECT: admin y agent pueden ver el historial
create policy "history_select"
  on property_status_history for select
  using (public.current_user_role() in ('admin', 'agent'));

-- INSERT: admin y agent pueden registrar cambios de estado
create policy "history_insert"
  on property_status_history for insert
  with check (public.current_user_role() in ('admin', 'agent'));
