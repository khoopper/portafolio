-- Carito Music: quién tiene la app, su licencia, la prueba de 3 días y el respaldo de su biblioteca.
--
-- La app Android entra con la cuenta de Google del amigo (Supabase Auth, id_token) y SOLO puede llamar a las funciones
-- carito_check_in, carito_take_over, carito_save_library y carito_load_library, que trabajan con su propia fila (auth.uid()).
-- Las tablas no se pueden leer ni escribir desde la app ni desde el navegador: el panel /admin/carito usa la clave secreta
-- en el servidor, después de comprobar la sesión de administrador (correo + MFA).

-- Crockford base32 de 5 caracteres: el código que muestra cada teléfono.
create domain public.carito_device_code as text check (value ~ '^[0-9A-HJKMNP-TV-Z]{5}$');

create table public.carito_members (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  name               text check (char_length(name) <= 120),
  photo_url          text check (char_length(photo_url) <= 500),
  -- El teléfono donde la cuenta está activa (una cuenta, un teléfono). null = libre: el próximo que entre la toma.
  device_code        public.carito_device_code,
  device_model       text check (char_length(device_model) <= 80),
  app_version        text check (char_length(app_version) <= 20),
  registered_at      timestamptz not null default now(),
  last_seen_at       timestamptz not null default now(),
  trial_ends_at      timestamptz,
  -- Último día válido, en la fecha de El Salvador. licence_forever = sin límite.
  licence_until      date,
  licence_forever    boolean not null default false,
  licence_granted_at timestamptz,
  -- Llegó con una licencia de antes del registro (la app lo dice): recibe 30 días para que el dueño decida.
  legacy             boolean not null default false,
  revoked_at         timestamptz,
  device_changes     integer not null default 0
);

create index carito_members_last_seen_idx on public.carito_members (last_seen_at desc);

-- Una prueba por teléfono, aunque cambie de cuenta de Google. Sobrevive a borrar al miembro.
create table public.carito_trials (
  device_code public.carito_device_code primary key,
  user_id     uuid references auth.users(id) on delete set null,
  started_at  timestamptz not null default now()
);

-- Playlists, favoritas y reproducciones de la cuenta (el mismo respaldo que la app guarda en la carpeta de música).
create table public.carito_libraries (
  user_id    uuid primary key references public.carito_members(user_id) on delete cascade,
  snapshot   jsonb not null,
  playlists  integer not null default 0,
  favorites  integer not null default 0,
  bytes      integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.carito_members enable row level security;
alter table public.carito_trials enable row level security;
alter table public.carito_libraries enable row level security;
revoke all on public.carito_members, public.carito_trials, public.carito_libraries from public, anon, authenticated;

-- Lo que la app necesita saber de su fila: si abre, por qué y hasta cuándo. Misma regla que src/lib/carito/licence.ts.
create function public.carito_status(m public.carito_members, p_device text)
returns jsonb
language sql
stable
set search_path = public
as $$
  with s as (
    select
      (now() at time zone 'America/El_Salvador')::date as today,
      ((m.licence_until + 1)::timestamp at time zone 'America/El_Salvador') as licence_end
  ), r as (
    select case
      when m.revoked_at is not null then 'revoked'
      when m.device_code is distinct from p_device then 'other_device'
      when m.licence_forever then 'forever'
      when m.licence_until >= s.today then 'licence'
      when m.trial_ends_at > now() then 'trial'
      when m.licence_until is not null then 'expired'
      when m.trial_ends_at is not null then 'trial_ended'
      else 'waiting'
    end as reason, s.licence_end
    from s
  )
  select jsonb_build_object(
    'access', r.reason in ('forever', 'licence', 'trial'),
    'reason', r.reason,
    'until', case r.reason when 'licence' then r.licence_end when 'trial' then m.trial_ends_at end,
    'licence_until', m.licence_until,
    'trial_ends_at', m.trial_ends_at,
    'legacy', m.legacy,
    'device_model', m.device_model,
    'server_time', now()
  )
  from r
$$;

revoke execute on function public.carito_status(public.carito_members, text) from public, anon, authenticated;

-- Cada vez que la app abre (y cada pocas horas): registra la cuenta la primera vez (con prueba de 3 días si este teléfono
-- nunca tuvo una), dice que está en uso y devuelve su estado.
create function public.carito_check_in(p_device text, p_model text, p_version text, p_legacy boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_user   auth.users;
  v_member public.carito_members;
  v_name   text;
  v_photo  text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_device is null or p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then
    raise exception 'bad_device' using errcode = '22023';
  end if;

  select * into v_user from auth.users where id = v_uid;
  v_name := left(coalesce(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name'), 120);
  v_photo := left(coalesce(v_user.raw_user_meta_data->>'avatar_url', v_user.raw_user_meta_data->>'picture'), 500);

  select * into v_member from public.carito_members where user_id = v_uid for update;

  if not found then
    insert into public.carito_members (user_id, email, name, photo_url, device_code, device_model, app_version, legacy, licence_until)
    values (
      v_uid, v_user.email, v_name, v_photo, p_device, left(p_model, 80), left(p_version, 20), coalesce(p_legacy, false),
      case when coalesce(p_legacy, false) then (now() at time zone 'America/El_Salvador')::date + 30 end
    )
    returning * into v_member;

    if not coalesce(p_legacy, false) then
      insert into public.carito_trials (device_code, user_id) values (p_device, v_uid) on conflict (device_code) do nothing;
      if found then
        update public.carito_members set trial_ends_at = now() + interval '3 days' where user_id = v_uid returning * into v_member;
      end if;
    end if;
  else
    update public.carito_members
       set email = v_user.email,
           name = coalesce(v_name, name),
           photo_url = coalesce(v_photo, photo_url),
           device_code = coalesce(device_code, p_device),
           device_model = case when coalesce(device_code, p_device) = p_device then left(p_model, 80) else device_model end,
           app_version = case when coalesce(device_code, p_device) = p_device then left(p_version, 20) else app_version end,
           last_seen_at = case when coalesce(device_code, p_device) = p_device then now() else last_seen_at end
     where user_id = v_uid
    returning * into v_member;
  end if;

  return public.carito_status(v_member, p_device);
end;
$$;

-- "Usar en este teléfono": la cuenta pasa a este teléfono; el anterior se bloquea en su próxima comprobación.
create function public.carito_take_over(p_device text, p_model text, p_version text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.carito_members;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_device is null or p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then
    raise exception 'bad_device' using errcode = '22023';
  end if;
  update public.carito_members
     set device_code = p_device,
         device_model = left(p_model, 80),
         app_version = left(p_version, 20),
         last_seen_at = now(),
         device_changes = device_changes + case when device_code is distinct from p_device then 1 else 0 end
   where user_id = auth.uid()
  returning * into v_member;
  if not found then
    raise exception 'not_registered' using errcode = 'P0002';
  end if;
  return public.carito_status(v_member, p_device);
end;
$$;

-- El respaldo de la biblioteca de la cuenta (hasta 5 MB).
create function public.carito_save_library(p_snapshot jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bytes integer := octet_length(p_snapshot::text);
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'bad_snapshot' using errcode = '22023';
  end if;
  if v_bytes > 5000000 then
    raise exception 'too_large' using errcode = '54000';
  end if;
  if not exists (select 1 from public.carito_members where user_id = auth.uid()) then
    raise exception 'not_registered' using errcode = 'P0002';
  end if;
  insert into public.carito_libraries (user_id, snapshot, playlists, favorites, bytes, updated_at)
  values (
    auth.uid(), p_snapshot,
    case when jsonb_typeof(p_snapshot->'playlists') = 'array' then jsonb_array_length(p_snapshot->'playlists') else 0 end,
    case when jsonb_typeof(p_snapshot->'favorites') = 'array' then jsonb_array_length(p_snapshot->'favorites') else 0 end,
    v_bytes, now()
  )
  on conflict (user_id) do update
     set snapshot = excluded.snapshot, playlists = excluded.playlists, favorites = excluded.favorites,
         bytes = excluded.bytes, updated_at = now();
end;
$$;

create function public.carito_load_library()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select snapshot from public.carito_libraries where user_id = auth.uid()
$$;

revoke execute on function public.carito_check_in(text, text, text, boolean) from public, anon;
revoke execute on function public.carito_take_over(text, text, text) from public, anon;
revoke execute on function public.carito_save_library(jsonb) from public, anon;
revoke execute on function public.carito_load_library() from public, anon;
grant execute on function public.carito_check_in(text, text, text, boolean) to authenticated;
grant execute on function public.carito_take_over(text, text, text) to authenticated;
grant execute on function public.carito_save_library(jsonb) to authenticated;
grant execute on function public.carito_load_library() to authenticated;
