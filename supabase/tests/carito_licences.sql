-- Run in the Supabase SQL Editor after 20261018010000_carito_licences.sql. Everything is rolled back at the end.
begin;

insert into public.carito_owner_pairings (code_hash, expires_at) values
  (public.carito_sha256('PAIRCODE'), now() + interval '15 minutes'),
  (public.carito_sha256('OLDCODE1'), now() - interval '1 minute');

do $$
declare
  v_owner text;
  v_code text;
  s jsonb;
  v_token text;
  v_id uuid;
begin
  -- Pairing: one use, not after it expires.
  assert public.carito_owner_pair('OLDCODE1', 'x') is null, 'un código vencido no vincula';
  v_owner := public.carito_owner_pair('pair-code', 'Galaxy S24');
  assert v_owner is not null and length(v_owner) = 64, 'el código vincula el teléfono del dueño';
  assert public.carito_owner_pair('PAIRCODE', 'x') is null, 'el código es de un solo uso';

  -- The owner creates a licence for a month; a friend types it (with typos a person makes) and the phone is tied to it.
  v_code := public.carito_owner_create(v_owner, 'Ana', null, (now() at time zone 'America/El_Salvador')::date + 30, false);
  assert v_code ~ '^[0-9A-HJKMNP-TV-Z]{9}$', 'código de 9 caracteres';
  s := public.carito_licence_activate(lower(substr(v_code, 1, 3) || '-' || substr(v_code, 4)), 'K7P2Q', 'Moto G', '2.7.1');
  assert (s->>'access')::boolean and s->>'reason' = 'licence' and length(s->>'token') = 64, 'la licencia abre y da un token';
  v_token := s->>'token';
  assert public.carito_licence_check(v_token, 'K7P2Q', 'Moto G', '2.7.1')->>'reason' = 'licence', 'el token comprueba la licencia';

  -- Another phone with the same licence: blocked, unless it takes it over; then the first phone's token stops working.
  assert public.carito_licence_activate(v_code, 'ZZ9AB', 'Pixel', '2.7.1')->>'reason' = 'other_device', 'otro teléfono no la toma solo';
  s := public.carito_licence_activate(v_code, 'ZZ9AB', 'Pixel', '2.7.1', true);
  assert (s->>'access')::boolean, 'tomarla la pasa a este teléfono';
  assert public.carito_licence_check(v_token, 'K7P2Q', 'Moto G', '2.7.1')->>'reason' = 'unknown', 'el teléfono anterior pierde la licencia';
  v_token := s->>'token';

  -- Library per licence.
  perform public.carito_licence_save_library(v_token, '{"version": 1, "playlists": [{"name": "Gym"}], "favorites": []}');
  assert public.carito_licence_load_library(v_token)->'playlists'->0->>'name' = 'Gym', 'la biblioteca vuelve con la licencia';

  -- The owner revokes and renews.
  select l.id into v_id from public.carito_licences l where l.code = v_code;
  perform public.carito_owner_update(v_owner, v_id, null, null, true);
  assert public.carito_licence_check(v_token, 'ZZ9AB', 'Pixel', '2.7.1')->>'reason' = 'revoked', 'revocada no abre';
  perform public.carito_owner_update(v_owner, v_id, null, true, false);
  assert public.carito_licence_check(v_token, 'ZZ9AB', 'Pixel', '2.7.1')->>'reason' = 'forever', 'restaurada y sin límite';
  perform public.carito_owner_update(v_owner, v_id, current_date - 2, false, null);
  assert public.carito_licence_check(v_token, 'ZZ9AB', 'Pixel', '2.7.1')->>'reason' = 'expired', 'con un día pasado, vencida';

  -- Licences from the 2.6 app: imported tied to their phones, which take them by themselves (once).
  assert public.carito_owner_import(v_owner, '[{"device": "M3XRT", "name": "Beto", "forever": true}, {"device": "QW8RT", "name": "Caro", "until": "2027-01-17", "licence": "0EQWW6V6Z"}]') = 2, 'importa dos';
  assert public.carito_owner_import(v_owner, '[{"device": "M3XRT", "name": "Beto", "forever": true}]') = 0, 'no duplica';
  s := public.carito_licence_claim('M3XRT', 'Moto E', '2.7.1');
  assert s->>'reason' = 'forever' and s ? 'token', 'el teléfono de una licencia anterior la toma solo';
  assert public.carito_licence_claim('M3XRT', 'Moto E', '2.7.1')->>'reason' = 'unknown', 'solo una vez';
  assert public.carito_licence_activate('0EQ-WW6-V6Z', 'QW8RT', 'x', '2.7.1')->>'reason' = 'licence', 'la licencia de 2.6 sigue escribiéndose igual';
  assert public.carito_licence_activate('ZZZZZZZZZ', 'K7P2Q', 'x', '2.7.1')->>'reason' = 'unknown', 'un código que no existe no abre';

  -- Only the owner's phone manages licences; nothing is reachable from outside the functions.
  begin
    perform public.carito_owner_licences('no-es-el-dueño');
    assert false, 'un token ajeno no lista licencias';
  exception when sqlstate '42501' then null;
  end;
  assert jsonb_array_length(public.carito_owner_licences(v_owner)) = 3, 'el dueño ve todas';
  assert not has_table_privilege('anon', 'public.carito_licences', 'SELECT'), 'anon no lee licencias';
  assert has_function_privilege('anon', 'public.carito_licence_activate(text, text, text, text, boolean)', 'EXECUTE'), 'la app activa sin cuenta';
  assert not has_function_privilege('anon', 'public.carito_owner_check(text)', 'EXECUTE'), 'la comprobación del dueño es interna';

  raise notice 'carito_licences: todas las comprobaciones pasaron';
end;
$$;

rollback;
