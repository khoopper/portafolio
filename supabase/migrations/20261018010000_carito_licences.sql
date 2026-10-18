-- Carito Music: licencias que crea el dueño (desde el panel o desde su teléfono), sin necesidad de entrar con Google.
--
-- Una licencia es un código de 9 caracteres (Crockford base32) con nombre, duración y, si se quiere, el teléfono que la usará.
-- El amigo la escribe una vez: el teléfono queda ligado a ella y recibe un token propio (solo se guarda su hash) con el que
-- comprueba su licencia y guarda su biblioteca. Las licencias que el dueño hizo en la app 2.6 se importan ligadas al código
-- de cada teléfono, y esos teléfonos se activan solos.
--
-- La app (sin sesión: rol anon) solo puede llamar a las funciones carito_licence_*; el teléfono del dueño, a las
-- carito_owner_* con el token que obtiene al vincularse con un código de un solo uso que da el panel. Las tablas no se
-- pueden leer ni escribir desde fuera; el panel usa la clave secreta en el servidor.

create table public.carito_licences (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[0-9A-HJKMNP-TV-Z]{9}$'),
  name               text not null default '' check (char_length(name) <= 60),
  device_code        public.carito_device_code,
  -- Importada de la app del dueño: el teléfono con ese código la toma solo, una vez, sin escribirla.
  claimable          boolean not null default false,
  device_model       text check (char_length(device_model) <= 80),
  app_version        text check (char_length(app_version) <= 20),
  licence_until      date,
  licence_forever    boolean not null default false,
  revoked_at         timestamptz,
  created_at         timestamptz not null default now(),
  activated_at       timestamptz,
  last_seen_at       timestamptz,
  device_changes     integer not null default 0,
  token_hash         text unique,
  source             text not null default 'panel' check (source in ('panel', 'app', 'import'))
);

create index carito_licences_device_idx on public.carito_licences (device_code);

create table public.carito_licence_libraries (
  licence_id uuid primary key references public.carito_licences(id) on delete cascade,
  snapshot   jsonb not null,
  playlists  integer not null default 0,
  favorites  integer not null default 0,
  bytes      integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Teléfonos del dueño vinculados (por el hash de su token) y los códigos de vinculación de un solo uso que da el panel.
create table public.carito_owner_devices (
  token_hash   text primary key,
  device_model text check (char_length(device_model) <= 80),
  created_at   timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create table public.carito_owner_pairings (
  code_hash  text primary key,
  expires_at timestamptz not null,
  used_at    timestamptz
);

alter table public.carito_licences enable row level security;
alter table public.carito_licence_libraries enable row level security;
alter table public.carito_owner_devices enable row level security;
alter table public.carito_owner_pairings enable row level security;
revoke all on public.carito_licences, public.carito_licence_libraries, public.carito_owner_devices, public.carito_owner_pairings
  from public, anon, authenticated;

create function public.carito_sha256(p_text text) returns text
language sql immutable set search_path = public, extensions
as $$ select encode(extensions.digest(p_text, 'sha256'), 'hex') $$;

-- Un código nuevo de 9 caracteres que no exista.
create function public.carito_new_code() returns text
language plpgsql volatile set search_path = public, extensions
as $$
declare
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_bytes bytea;
  v_code text;
begin
  loop
    v_bytes := extensions.gen_random_bytes(9);
    v_code := '';
    for i in 0..8 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.carito_licences where code = v_code);
  end loop;
  return v_code;
end;
$$;

-- Lo que la app necesita saber de una licencia: misma forma que carito_status (la de las cuentas de Google).
create function public.carito_licence_status(l public.carito_licences, p_device text) returns jsonb
language sql stable set search_path = public
as $$
  with r as (
    select case
      when l.revoked_at is not null then 'revoked'
      when l.device_code is distinct from p_device then 'other_device'
      when l.licence_forever then 'forever'
      when l.licence_until >= (now() at time zone 'America/El_Salvador')::date then 'licence'
      else 'expired'
    end as reason
  )
  select jsonb_build_object(
    'access', r.reason in ('forever', 'licence'),
    'reason', r.reason,
    'until', case when r.reason = 'licence' then ((l.licence_until + 1)::timestamp at time zone 'America/El_Salvador') end,
    'licence_until', l.licence_until,
    'name', l.name,
    'device_model', l.device_model,
    'server_time', now()
  )
  from r
$$;

revoke execute on function public.carito_sha256(text), public.carito_new_code(),
  public.carito_licence_status(public.carito_licences, text) from public, anon, authenticated;

-- El amigo escribe su licencia (o su teléfono la manda sola, si la tenía de antes). La primera vez el teléfono queda ligado; en
-- otro teléfono responde other_device, y con p_take_over la licencia pasa a este (el otro se bloquea en su próxima comprobación).
-- Devuelve el estado y, si el teléfono quedó ligado, su token (solo esta vez).
create function public.carito_licence_activate(p_code text, p_device text, p_model text, p_version text, p_take_over boolean default false)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_licence public.carito_licences;
  v_token text;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g'));
begin
  if p_device is null or p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then
    raise exception 'bad_device' using errcode = '22023';
  end if;
  v_code := translate(v_code, 'OILU', '011V');
  select * into v_licence from public.carito_licences where code = v_code for update;
  if not found then
    return jsonb_build_object('access', false, 'reason', 'unknown');
  end if;
  if v_licence.device_code is not null and v_licence.device_code <> p_device and not coalesce(p_take_over, false) then
    return public.carito_licence_status(v_licence, p_device);
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.carito_licences
     set device_changes = device_changes + case when device_code is not null and device_code <> p_device then 1 else 0 end,
         device_code = p_device,
         device_model = left(p_model, 80),
         app_version = left(p_version, 20),
         activated_at = coalesce(activated_at, now()),
         last_seen_at = now(),
         claimable = false,
         token_hash = public.carito_sha256(v_token)
   where id = v_licence.id
  returning * into v_licence;
  return public.carito_licence_status(v_licence, p_device) || jsonb_build_object('token', v_token);
end;
$$;

-- Un teléfono que tenía licencia antes del registro pregunta si el dueño importó una para él: la toma sola, una vez.
create function public.carito_licence_claim(p_device text, p_model text, p_version text)
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
    return jsonb_build_object('access', false, 'reason', 'unknown');
  end if;
  return public.carito_licence_activate(v_code, p_device, p_model, p_version, false);
end;
$$;

-- Cada vez que la app abre (y cada hora): el estado de la licencia de este teléfono.
create function public.carito_licence_check(p_token text, p_device text, p_model text, p_version text)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_licence public.carito_licences;
begin
  select * into v_licence from public.carito_licences where token_hash = public.carito_sha256(coalesce(p_token, '')) for update;
  if not found then
    -- Otro teléfono tomó la licencia (su token cambió) o el dueño la eliminó.
    return jsonb_build_object('access', false, 'reason', 'unknown');
  end if;
  if v_licence.device_code = p_device then
    update public.carito_licences set last_seen_at = now(), device_model = left(p_model, 80), app_version = left(p_version, 20)
     where id = v_licence.id returning * into v_licence;
  end if;
  return public.carito_licence_status(v_licence, p_device);
end;
$$;

create function public.carito_licence_save_library(p_token text, p_snapshot jsonb)
returns void
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_id uuid;
  v_bytes integer := octet_length(p_snapshot::text);
begin
  select id into v_id from public.carito_licences where token_hash = public.carito_sha256(coalesce(p_token, ''));
  if v_id is null then raise exception 'unknown_licence' using errcode = 'P0002'; end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then raise exception 'bad_snapshot' using errcode = '22023'; end if;
  if v_bytes > 5000000 then raise exception 'too_large' using errcode = '54000'; end if;
  insert into public.carito_licence_libraries (licence_id, snapshot, playlists, favorites, bytes, updated_at)
  values (
    v_id, p_snapshot,
    case when jsonb_typeof(p_snapshot->'playlists') = 'array' then jsonb_array_length(p_snapshot->'playlists') else 0 end,
    case when jsonb_typeof(p_snapshot->'favorites') = 'array' then jsonb_array_length(p_snapshot->'favorites') else 0 end,
    v_bytes, now()
  )
  on conflict (licence_id) do update
     set snapshot = excluded.snapshot, playlists = excluded.playlists, favorites = excluded.favorites, bytes = excluded.bytes, updated_at = now();
end;
$$;

create function public.carito_licence_load_library(p_token text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select b.snapshot from public.carito_licence_libraries b
    join public.carito_licences l on l.id = b.licence_id
   where l.token_hash = public.carito_sha256(coalesce(p_token, ''))
$$;

-- --- El teléfono del dueño ------------------------------------------------------------------------------------------------

-- Canjea el código de un solo uso del panel (15 minutos) por el token del teléfono del dueño.
create function public.carito_owner_pair(p_code text, p_model text)
returns text
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_token text;
begin
  update public.carito_owner_pairings set used_at = now()
   where code_hash = public.carito_sha256(upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g')))
     and used_at is null and expires_at > now();
  if not found then return null; end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.carito_owner_devices (token_hash, device_model) values (public.carito_sha256(v_token), left(p_model, 80));
  return v_token;
end;
$$;

create function public.carito_owner_check(p_token text) returns boolean
language plpgsql volatile security definer set search_path = public
as $$
begin
  update public.carito_owner_devices set last_used_at = now() where token_hash = public.carito_sha256(coalesce(p_token, ''));
  return found;
end;
$$;

-- Todas las licencias, las más nuevas primero.
create function public.carito_owner_licences(p_token text)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'code', l.code, 'name', l.name, 'device_code', l.device_code, 'device_model', l.device_model,
      'licence_until', l.licence_until, 'forever', l.licence_forever, 'revoked', l.revoked_at is not null,
      'activated_at', l.activated_at, 'last_seen_at', l.last_seen_at, 'created_at', l.created_at,
      'playlists', coalesce(b.playlists, 0)
    ) order by l.created_at desc)
    from public.carito_licences l left join public.carito_licence_libraries b on b.licence_id = l.id
  ), '[]'::jsonb);
end;
$$;

-- Crea una licencia para [p_name], hasta [p_until] o sin límite, ligada desde ya a [p_device] si se da.
create function public.carito_owner_create(p_token text, p_name text, p_device text, p_until date, p_forever boolean)
returns text
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_code text;
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  if p_device is not null and p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then raise exception 'bad_device' using errcode = '22023'; end if;
  if not coalesce(p_forever, false) and p_until is null then raise exception 'no_length' using errcode = '22023'; end if;
  v_code := public.carito_new_code();
  insert into public.carito_licences (code, name, device_code, licence_until, licence_forever, source)
  values (v_code, left(trim(coalesce(p_name, '')), 60), p_device, case when coalesce(p_forever, false) then null else p_until end,
          coalesce(p_forever, false), 'app');
  return v_code;
end;
$$;

-- Renueva, revoca o restaura una licencia.
create function public.carito_owner_update(p_token text, p_id uuid, p_until date, p_forever boolean, p_revoked boolean)
returns void
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  -- p_forever true: no limit; otherwise a p_until is the new last day; null leaves the length as it is. p_revoked null leaves it.
  update public.carito_licences
     set licence_until = case when p_forever is true then null when p_until is not null then p_until else licence_until end,
         licence_forever = case when p_forever is true then true when p_until is not null then false else licence_forever end,
         revoked_at = case when p_revoked is true then coalesce(revoked_at, now()) when p_revoked is false then null else revoked_at end
   where id = p_id;
end;
$$;

-- Las licencias que el dueño hizo en la app 2.6 y antes: [{code (teléfono), name, licence (texto que tiene ese teléfono, si es de
-- 2.6), until, forever}]. Cada una queda ligada a su teléfono, que la toma sola. No duplica: un teléfono ya importado se salta.
create function public.carito_owner_import(p_token text, p_items jsonb)
returns integer
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_added integer := 0;
  v_device text;
  v_code text;
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_device := upper(v_item->>'device');
    continue when v_device is null or v_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$';
    continue when exists (select 1 from public.carito_licences where device_code = v_device and source = 'import');
    v_code := upper(coalesce(v_item->>'licence', ''));
    if v_code !~ '^[0-9A-HJKMNP-TV-Z]{9}$' or exists (select 1 from public.carito_licences where code = v_code) then
      v_code := public.carito_new_code();
    end if;
    insert into public.carito_licences (code, name, device_code, claimable, licence_until, licence_forever, source, created_at)
    values (
      v_code, left(coalesce(v_item->>'name', ''), 60), v_device, true,
      case when coalesce((v_item->>'forever')::boolean, false) then null else (v_item->>'until')::date end,
      coalesce((v_item->>'forever')::boolean, false), 'import',
      coalesce(to_timestamp((v_item->>'issued_day')::bigint * 86400), now())
    );
    v_added := v_added + 1;
  end loop;
  return v_added;
end;
$$;

revoke execute on function public.carito_owner_check(text) from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.carito_licence_activate(text, text, text, text, boolean)',
    'public.carito_licence_claim(text, text, text)',
    'public.carito_licence_check(text, text, text, text)',
    'public.carito_licence_save_library(text, jsonb)',
    'public.carito_licence_load_library(text)',
    'public.carito_owner_pair(text, text)',
    'public.carito_owner_licences(text)',
    'public.carito_owner_create(text, text, text, date, boolean)',
    'public.carito_owner_update(text, uuid, date, boolean, boolean)',
    'public.carito_owner_import(text, jsonb)'
  ] loop
    execute format('revoke execute on function %s from public', f);
    execute format('grant execute on function %s to anon, authenticated', f);
  end loop;
end;
$$;
