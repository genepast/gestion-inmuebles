-- Función que inserta automáticamente un perfil con rol 'viewer'
-- cuando se crea un nuevo usuario en auth.users.
-- SECURITY DEFINER para poder escribir en public.profiles desde un contexto de auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que dispara la función luego de cada INSERT en auth.users.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
