-- ============================================================
-- Políticas para 'property_images'
-- ============================================================

-- SELECT: cualquier usuario autenticado puede ver imágenes
create policy "images_select"
  on property_images for select
  using (auth.uid() is not null);

-- INSERT: agent y admin pueden subir imágenes
create policy "images_insert"
  on property_images for insert
  with check (public.current_user_role() in ('admin', 'agent'));

-- UPDATE: agent y admin pueden modificar imágenes
create policy "images_update"
  on property_images for update
  using (public.current_user_role() in ('admin', 'agent'));

-- DELETE: agent y admin pueden eliminar imágenes
create policy "images_delete"
  on property_images for delete
  using (public.current_user_role() in ('admin', 'agent'));

-- ============================================================
-- Políticas para 'sync_logs'
-- ============================================================

-- SELECT: solo admin
create policy "sync_logs_select"
  on sync_logs for select
  using (public.current_user_role() = 'admin');

-- INSERT: solo admin (vía route handler)
create policy "sync_logs_insert"
  on sync_logs for insert
  with check (public.current_user_role() = 'admin');

-- UPDATE: solo admin
create policy "sync_logs_update"
  on sync_logs for update
  using (public.current_user_role() = 'admin');
