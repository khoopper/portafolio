-- Carito Music: las licencias de antes (app 2.2 a 2.5), de 8 caracteres, y los teléfonos que piden una nueva.
--
-- 1. Hasta la 2.5 el dueño le dio a cada amigo una licencia de 8 caracteres («TJGM-ZY82») hecha con el código de su teléfono, sin
--    fecha de vencimiento. La importación de la 2.6 las subió con otro texto (el «ZZZ-…» que mostraba la 2.6), que ellos nunca
--    recibieron. Desde aquí una licencia puede tener 8 caracteres, y la importación guarda el texto que el amigo tiene ("old"), también
--    en lugar del que ya había subido. La app 2.7.5 manda "old"; las anteriores no, y siguen igual.
-- 2. Un teléfono con una licencia de antes que el dueño no tiene en la lista ya no abre: al preguntar (carito_licence_claim) queda en
--    carito_licence_requests y la app dice «Licencia antigua». El dueño lo ve en el panel o en su teléfono y le crea una licencia con
--    el código de ese teléfono; como ese teléfono la pidió, la toma solo (sin escribirla) en su próxima comprobación.
--
-- Va después de 20261018020000_carito_licence_trials.sql (esta reemplaza su carito_owner_import).

alter table public.carito_licences drop constraint carito_licences_code_check;
alter table public.carito_licences add constraint carito_licences_code_check check (code ~ '^[0-9A-HJKMNP-TV-Z]{8,9}$');

create or replace function public.carito_owner_import(p_token text, p_items jsonb)
returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_added integer := 0;
  v_device text;
  v_code text;
  v_old text;
  v_issued timestamptz;
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_device := upper(v_item->>'device');
    continue when v_device is null or v_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$';
    -- "day" de la 2.6: días desde 1970 (UTC); 0 o nada es que no se sabe.
    v_issued := case when coalesce((v_item->>'issued_day')::bigint, 0) > 0
      then to_timestamp((v_item->>'issued_day')::bigint * 86400) + interval '18 hours' end;
    -- La licencia de 8 caracteres que el amigo recibió antes de la 2.6, si la trae y nadie más la tiene.
    v_old := upper(coalesce(v_item->>'old', ''));
    if v_old !~ '^[0-9A-HJKMNP-TV-Z]{8}$' or exists (select 1 from public.carito_licences where code = v_old) then
      v_old := null;
    end if;
    if exists (select 1 from public.carito_licences where device_code = v_device and source = 'import') then
      update public.carito_licences set created_at = v_issued
       where device_code = v_device and source = 'import' and v_issued is not null and created_at is distinct from v_issued;
      -- La que ya subió con otro texto toma el que el amigo tiene (el teléfono que ya la tomó sigue igual: va por su token).
      if v_old is not null then
        update public.carito_licences set code = v_old
         where id = (select id from public.carito_licences where device_code = v_device and source = 'import' order by created_at limit 1);
      end if;
      continue;
    end if;
    v_code := coalesce(v_old, upper(coalesce(v_item->>'licence', '')));
    if v_code !~ '^[0-9A-HJKMNP-TV-Z]{8,9}$' or exists (select 1 from public.carito_licences where code = v_code) then
      v_code := public.carito_new_code();
    end if;
    insert into public.carito_licences (code, name, device_code, claimable, licence_until, licence_forever, source, created_at)
    values (
      v_code, left(coalesce(v_item->>'name', ''), 60), v_device, true,
      case when coalesce((v_item->>'forever')::boolean, false) then null else (v_item->>'until')::date end,
      coalesce((v_item->>'forever')::boolean, false), 'import',
      coalesce(v_issued, now())
    );
    v_added := v_added + 1;
  end loop;
  return v_added;
end;
$$;

-- --- Los teléfonos con una licencia de antes que piden una nueva --------------------------------------------------------------

create table public.carito_licence_requests (
  device_code  public.carito_device_code primary key,
  device_model text check (char_length(device_model) <= 80),
  app_version  text check (char_length(app_version) <= 20),
  asked_at     timestamptz not null default now(),
  last_asked_at timestamptz not null default now()
);

alter table public.carito_licence_requests enable row level security;
revoke all on public.carito_licence_requests from public, anon, authenticated;

-- Una licencia nueva para un teléfono que la pidió se la lleva ese teléfono solo (desde el panel o desde el teléfono del dueño).
create function public.carito_licence_for_request() returns trigger
language plpgsql set search_path = public
as $$
begin
  if new.device_code is not null and exists (select 1 from public.carito_licence_requests where device_code = new.device_code) then
    new.claimable := true;
  end if;
  return new;
end;
$$;

create trigger carito_licences_for_request before insert on public.carito_licences
  for each row execute function public.carito_licence_for_request();

-- Igual que antes, y si este teléfono no tiene ninguna licencia queda pedida ('old_licence'): la app dice que la licencia es antigua.
create or replace function public.carito_licence_claim(p_device text, p_model text, p_version text)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_code text;
begin
  if p_device is null or p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then
    raise exception 'bad_device' using errcode = '22023';
  end if;
  select code into v_code from public.carito_licences
   where device_code = p_device and claimable and revoked_at is null
   order by licence_forever desc, licence_until desc nulls last
   limit 1;
  if v_code is null then
    -- Ya tiene una licencia que otro teléfono tomó (o que hay que escribir): como antes.
    if exists (select 1 from public.carito_licences where device_code = p_device and revoked_at is null) then
      return jsonb_build_object('access', false, 'reason', 'unknown');
    end if;
    -- Un tope, por si alguien llama esto con códigos inventados.
    if exists (select 1 from public.carito_licence_requests where device_code = p_device)
       or (select count(*) from public.carito_licence_requests) < 500 then
      insert into public.carito_licence_requests (device_code, device_model, app_version)
      values (p_device, left(p_model, 80), left(p_version, 20))
      on conflict (device_code) do update
         set device_model = excluded.device_model, app_version = excluded.app_version, last_asked_at = now();
    end if;
    return jsonb_build_object('access', false, 'reason', 'old_licence');
  end if;
  delete from public.carito_licence_requests where device_code = p_device;
  return public.carito_licence_activate(v_code, p_device, p_model, p_version, false);
end;
$$;

-- Los que piden una licencia nueva y todavía no tienen una viva, los más recientes primero (el teléfono del dueño).
create function public.carito_owner_requests(p_token text)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'device_code', r.device_code, 'device_model', r.device_model, 'app_version', r.app_version,
      'asked_at', r.asked_at, 'last_asked_at', r.last_asked_at
    ) order by r.last_asked_at desc)
    from public.carito_licence_requests r
   where not exists (select 1 from public.carito_licences l where l.device_code = r.device_code and l.revoked_at is null)
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.carito_licence_for_request() from public, anon, authenticated;
revoke execute on function public.carito_owner_requests(text) from public;
grant execute on function public.carito_owner_requests(text) to anon, authenticated;
