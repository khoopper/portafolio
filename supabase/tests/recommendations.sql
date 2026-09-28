-- Run in the Supabase SQL Editor after the migration. Everything is rolled back at the end.
begin;

insert into public.recommendation_invites (project_slug, note, token_hash, expires_at) values
  ('demo', 'ok', 'hash-ok', now() + interval '1 day'),
  ('demo', 'ok2', 'hash-ok2', now() + interval '1 day'),
  ('demo', 'usada', 'hash-used', now() + interval '1 day'),
  ('demo', 'caducada', 'hash-expired', now() - interval '1 day'),
  ('demo', 'revocada', 'hash-revoked', now() + interval '1 day');
update public.recommendation_invites set used_at = now() where token_hash = 'hash-used';
update public.recommendation_invites set revoked_at = now() where token_hash = 'hash-revoked';

do $$
declare
  v_id uuid;
  v_failed boolean;
  v_hash text;
  v_body text := repeat('Excelente trabajo. ', 3);
begin
  v_id := public.submit_recommendation(gen_random_uuid(), 'hash-ok', 'google', 'sub-1', 'Ana López', 'ana@clinica.com',
                                       'clinica.com', 'Directora', 'Clínica San Rafael', v_body, null);
  assert (select used_at is not null from public.recommendation_invites where token_hash = 'hash-ok'), 'la invitación debe quedar usada';
  assert (select status from public.recommendations where id = v_id) = 'pending', 'debe entrar como pendiente';
  assert (select count(*) from public.public_recommendations where id = v_id) = 0, 'una pendiente no es pública';

  foreach v_hash in array array['hash-ok', 'hash-used', 'hash-expired', 'hash-revoked', 'no-existe'] loop
    v_failed := false;
    begin
      perform public.submit_recommendation(gen_random_uuid(), v_hash, 'google', 'sub-2', 'Otro', 'o@x.com', null, 'Cargo', 'Empresa', v_body, null);
    exception when sqlstate 'P0001' then
      v_failed := true;
    end;
    assert v_failed, format('el link %s debe fallar con P0001', v_hash);
  end loop;

  -- Same person, same project, another invite: rejected and that invite stays unused.
  v_failed := false;
  begin
    perform public.submit_recommendation(gen_random_uuid(), 'hash-ok2', 'google', 'sub-1', 'Ana López', 'ana@clinica.com',
                                         'clinica.com', 'Directora', 'Clínica San Rafael', v_body, null);
  exception when unique_violation then
    v_failed := true;
  end;
  assert v_failed, 'la misma persona no puede recomendar dos veces el mismo proyecto';
  assert (select used_at is null from public.recommendation_invites where token_hash = 'hash-ok2'), 'el link debe seguir sin usar';

  update public.recommendations set status = 'approved' where id = v_id;
  assert (select count(*) from public.public_recommendations where id = v_id) = 1, 'una aprobada es pública';

  -- The public view is read-only for the browser roles (no tampering with published recommendations).
  assert has_table_privilege('anon', 'public.public_recommendations', 'SELECT'), 'anon puede leer la vista';
  assert not has_table_privilege('anon', 'public.public_recommendations', 'UPDATE'), 'anon no puede modificar la vista';
  assert not has_table_privilege('anon', 'public.public_recommendations', 'DELETE'), 'anon no puede borrar en la vista';
  assert not has_table_privilege('anon', 'public.public_recommendations', 'INSERT'), 'anon no puede insertar en la vista';
  assert not has_table_privilege('authenticated', 'public.public_recommendations', 'UPDATE'), 'authenticated no puede modificar la vista';
  assert not has_table_privilege('authenticated', 'public.public_recommendations', 'DELETE'), 'authenticated no puede borrar en la vista';
  assert not has_table_privilege('authenticated', 'public.public_recommendations', 'INSERT'), 'authenticated no puede insertar en la vista';

  -- Base table: private columns are never readable by the browser roles, and nothing is writable.
  assert not has_column_privilege('anon', 'public.recommendations', 'email', 'SELECT'), 'anon no puede leer correos';
  assert not has_column_privilege('anon', 'public.recommendations', 'provider_sub', 'SELECT'), 'anon no puede leer provider_sub';
  assert not has_table_privilege('anon', 'public.recommendations', 'UPDATE'), 'anon no puede modificar la tabla';
  assert not has_table_privilege('anon', 'public.recommendation_invites', 'SELECT'), 'anon no puede leer invitaciones';

  -- With security_invoker the view obeys RLS: as anon, a pending row stays invisible.
  update public.recommendations set status = 'pending' where id = v_id;
  set local role anon;
  assert (select count(*) from public.public_recommendations where id = v_id) = 0, 'anon no ve pendientes';
  reset role;

  raise notice 'recommendations.sql: todas las pruebas pasaron';
end $$;

rollback;
