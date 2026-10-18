-- Run in the Supabase SQL Editor after 20261018000000_carito_music.sql. Everything is rolled back at the end.
begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-0000000000a1', 'ana@test.carito', '{"full_name": "Ana"}'),
  ('00000000-0000-4000-8000-0000000000b2', 'beto@test.carito', '{"full_name": "Beto"}'),
  ('00000000-0000-4000-8000-0000000000c3', 'caro@test.carito', '{"full_name": "Caro"}');

do $$
declare
  ana  constant uuid := '00000000-0000-4000-8000-0000000000a1';
  beto constant uuid := '00000000-0000-4000-8000-0000000000b2';
  caro constant uuid := '00000000-0000-4000-8000-0000000000c3';
  s jsonb;
  failed boolean;
begin
  -- A new account on a phone that never had a trial: 3 free days.
  perform set_config('request.jwt.claims', json_build_object('sub', ana, 'role', 'authenticated')::text, true);
  s := public.carito_check_in('K7P2Q', 'Galaxy A54', '2.7', false);
  assert (s->>'access')::boolean and s->>'reason' = 'trial', 'una cuenta nueva empieza con prueba';
  assert (select trial_ends_at between now() + interval '71 hours' and now() + interval '73 hours' from public.carito_members where user_id = ana),
    'la prueba dura 3 días';
  assert (select name from public.carito_members where user_id = ana) = 'Ana', 'guarda el nombre de la cuenta de Google';

  -- Checking in again does not start another trial.
  s := public.carito_check_in('K7P2Q', 'Galaxy A54', '2.7.1', false);
  assert s->>'reason' = 'trial' and (select app_version from public.carito_members where user_id = ana) = '2.7.1', 'actualiza la versión';

  -- Another account on the same phone: no second trial.
  perform set_config('request.jwt.claims', json_build_object('sub', beto, 'role', 'authenticated')::text, true);
  s := public.carito_check_in('K7P2Q', 'Galaxy A54', '2.7', false);
  assert not (s->>'access')::boolean and s->>'reason' = 'waiting', 'el mismo teléfono no repite la prueba';

  -- A phone that had a licence before the registration: 30 days for the owner to decide, and no trial used.
  perform set_config('request.jwt.claims', json_build_object('sub', caro, 'role', 'authenticated')::text, true);
  s := public.carito_check_in('M3XRT', 'Moto G', '2.7', true);
  assert s->>'reason' = 'licence' and (select legacy and licence_until = (now() at time zone 'America/El_Salvador')::date + 30
    from public.carito_members where user_id = caro), 'una licencia anterior recibe 30 días';
  assert not exists (select 1 from public.carito_trials where device_code = 'M3XRT'), 'no gasta la prueba de ese teléfono';

  -- The same account on another phone is blocked until it takes over; then the first phone is the blocked one.
  s := public.carito_check_in('ZZ9AB', 'Pixel 8', '2.7', false);
  assert s->>'reason' = 'other_device' and s->>'device_model' = 'Moto G', 'otro teléfono queda bloqueado y sabe cuál es el activo';
  s := public.carito_take_over('ZZ9AB', 'Pixel 8', '2.7');
  assert (s->>'access')::boolean and (select device_changes from public.carito_members where user_id = caro) = 1, 'tomar la cuenta la pasa a este teléfono';
  s := public.carito_check_in('M3XRT', 'Moto G', '2.7', false);
  assert s->>'reason' = 'other_device', 'el teléfono anterior queda bloqueado';

  -- The owner's decisions (the panel writes the table directly).
  update public.carito_members set revoked_at = now() where user_id = caro;
  assert public.carito_check_in('ZZ9AB', 'Pixel 8', '2.7', false)->>'reason' = 'revoked', 'revocada no abre';
  update public.carito_members set revoked_at = null, licence_until = current_date - 3 where user_id = caro;
  assert public.carito_check_in('ZZ9AB', 'Pixel 8', '2.7', false)->>'reason' = 'expired', 'vencida no abre';
  update public.carito_members set licence_forever = true where user_id = caro;
  s := public.carito_check_in('ZZ9AB', 'Pixel 8', '2.7', false);
  assert s->>'reason' = 'forever' and s->'until' = 'null'::jsonb, 'sin límite abre sin fecha';

  -- Library backup round trip.
  perform public.carito_save_library('{"version": 1, "playlists": [{"name": "Gym"}, {"name": "Fiesta"}], "favorites": [["yt:x", 1]]}');
  assert (select playlists = 2 and favorites = 1 from public.carito_libraries where user_id = caro), 'cuenta playlists y favoritas';
  assert public.carito_load_library()->'playlists'->0->>'name' = 'Gym', 'devuelve el respaldo de la cuenta';
  perform set_config('request.jwt.claims', json_build_object('sub', ana, 'role', 'authenticated')::text, true);
  assert public.carito_load_library() is null, 'cada cuenta ve solo su respaldo';

  failed := false;
  begin
    perform public.carito_check_in('no-es-un-codigo', 'x', 'x', false);
  exception when sqlstate '22023' then failed := true;
  end;
  assert failed, 'rechaza códigos de teléfono inválidos';

  -- Nobody reaches the tables from the app or the browser; the app only calls its four functions.
  assert not has_table_privilege('authenticated', 'public.carito_members', 'SELECT'), 'authenticated no lee miembros';
  assert not has_table_privilege('authenticated', 'public.carito_members', 'UPDATE'), 'authenticated no cambia licencias';
  assert not has_table_privilege('anon', 'public.carito_libraries', 'SELECT'), 'anon no lee bibliotecas';
  assert not has_function_privilege('anon', 'public.carito_check_in(text, text, text, boolean)', 'EXECUTE'), 'anon no se registra';
  assert has_function_privilege('authenticated', 'public.carito_check_in(text, text, text, boolean)', 'EXECUTE'), 'la app se registra';
  assert not has_function_privilege('authenticated', 'public.carito_status(public.carito_members, text)', 'EXECUTE'), 'el estado es interno';

  raise notice 'carito_music: todas las comprobaciones pasaron';
end;
$$;

rollback;
