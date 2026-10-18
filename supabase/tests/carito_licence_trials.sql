-- Run in the Supabase SQL Editor after 20261018020000_carito_licence_trials.sql. Everything is rolled back at the end.
begin;

insert into public.carito_owner_pairings (code_hash, expires_at) values (public.carito_sha256('TRIALPAIR'), now() + interval '15 minutes');

do $$
declare
  v_owner text;
  v_code text;
  v_id uuid;
  s jsonb;
begin
  v_owner := public.carito_owner_pair('TRIALPAIR', 'Galaxy S24');

  -- The start: nobody wrote it yet...
  v_code := public.carito_owner_create(v_owner, 'Inicio', null, current_date + 30, false);
  assert public.carito_licence_start((select l from public.carito_licences l where l.code = v_code)) is null, 'sin escribir no ha empezado';
  s := public.carito_licence_activate(v_code, 'H3K9M', 'Pixel 8', '2.7.4');
  assert (s->>'started')::date = (now() at time zone 'America/El_Salvador')::date, 'empieza el día en que se escribe';

  -- ...and a 2.6 licence started the day the owner gave it then; importing again fixes that day on the one already up.
  perform public.carito_owner_import(v_owner, '[{"device":"Q4R7T","name":"Vieja","until":null,"forever":true,"issued_day":0}]'::jsonb);
  perform public.carito_owner_import(v_owner, '[{"device":"Q4R7T","name":"Vieja","until":null,"forever":true,"issued_day":20500}]'::jsonb);
  assert public.carito_licence_start((select l from public.carito_licences l where l.device_code = 'Q4R7T')) = date '1970-01-01' + 20500,
    'la de la 2.6 empezó el día en que se dio';
  assert jsonb_path_exists(public.carito_owner_licences(v_owner), '$[*] ? (@.source == "import" && @.started != null)'), 'la lista trae el inicio';

  -- A 3-day trial does not start when it is created...
  v_code := public.carito_owner_create(v_owner, 'Prueba Ana', null, null, false, 3::smallint);
  assert (select licence_until is null and trial_days = 3 from public.carito_licences where code = v_code), 'la prueba no empieza al crearla';

  -- ...but the day the friend writes it: three days from today, as a trial.
  s := public.carito_licence_activate(v_code, 'K7P2Q', 'Moto G', '2.7.4');
  assert (s->>'access')::boolean and s->>'reason' = 'trial' and (s->>'trial')::boolean, 'abre como prueba';
  assert (select licence_until = (now() at time zone 'America/El_Salvador')::date + 3 from public.carito_licences where code = v_code), 'dura 3 días';

  -- Ended: trial_ended, not expired.
  update public.carito_licences set licence_until = current_date - 1 where code = v_code;
  assert public.carito_licence_check((select null::text), 'K7P2Q', 'x', 'x')->>'reason' = 'unknown', 'sin token no hay estado';
  select id into v_id from public.carito_licences where code = v_code;
  assert public.carito_licence_status((select l from public.carito_licences l where l.id = v_id), 'K7P2Q')->>'reason' = 'trial_ended', 'la prueba termina';

  -- The owner keeps them: a day (or no limit) turns the trial into a licence.
  perform public.carito_owner_update(v_owner, v_id, (now() at time zone 'America/El_Salvador')::date + 30, false, null);
  assert (select trial_days is null from public.carito_licences where id = v_id), 'con fecha deja de ser prueba';
  assert public.carito_licence_status((select l from public.carito_licences l where l.id = v_id), 'K7P2Q')->>'reason' = 'licence', 'ahora es licencia';

  -- The old way of creating (no trial argument) still works.
  assert public.carito_owner_create(v_owner, 'Beto', null, current_date + 10, false) ~ '^[0-9A-HJKMNP-TV-Z]{9}$', 'crear sin prueba sigue igual';
  assert jsonb_path_exists(public.carito_owner_licences(v_owner), '$[*] ? (@.trial_days == null)'), 'la lista dice cuáles son pruebas';

  raise notice 'carito_licence_trials: todas las comprobaciones pasaron';
end;
$$;

rollback;
