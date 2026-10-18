-- Carito Music: licencias de prueba. El dueño da una "Prueba de 3 días" (desde el panel o su teléfono); los días empiezan a contar
-- cuando el amigo la escribe en su teléfono, no cuando se crea. Si el dueño le pone una fecha o "sin límite", deja de ser prueba.

alter table public.carito_licences add column trial_days smallint check (trial_days between 1 and 30);

-- El estado que ve la app: una prueba vigente es 'trial'; terminada, 'trial_ended'.
create or replace function public.carito_licence_status(l public.carito_licences, p_device text) returns jsonb
language sql stable set search_path = public
as $$
  with r as (
    select case
      when l.revoked_at is not null then 'revoked'
      when l.device_code is distinct from p_device then 'other_device'
      when l.licence_forever then 'forever'
      when l.licence_until >= (now() at time zone 'America/El_Salvador')::date then case when l.trial_days is not null then 'trial' else 'licence' end
      when l.trial_days is not null then 'trial_ended'
      else 'expired'
    end as reason
  )
  select jsonb_build_object(
    'access', r.reason in ('forever', 'licence', 'trial'),
    'reason', r.reason,
    'until', case when r.reason in ('licence', 'trial') then ((l.licence_until + 1)::timestamp at time zone 'America/El_Salvador') end,
    'licence_until', l.licence_until,
    'trial', l.trial_days is not null,
    'name', l.name,
    'device_model', l.device_model,
    'server_time', now()
  )
  from r
$$;

revoke execute on function public.carito_licence_status(public.carito_licences, text) from public, anon, authenticated;

-- Igual que antes, y una prueba que se escribe por primera vez empieza a contar sus días hoy.
create or replace function public.carito_licence_activate(p_code text, p_device text, p_model text, p_version text, p_take_over boolean default false)
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
         licence_until = case
           when trial_days is not null and activated_at is null then (now() at time zone 'America/El_Salvador')::date + trial_days
           else licence_until
         end,
         activated_at = coalesce(activated_at, now()),
         last_seen_at = now(),
         claimable = false,
         token_hash = public.carito_sha256(v_token)
   where id = v_licence.id
  returning * into v_licence;
  return public.carito_licence_status(v_licence, p_device) || jsonb_build_object('token', v_token);
end;
$$;

-- La lista del dueño dice cuáles son pruebas.
create or replace function public.carito_owner_licences(p_token text)
returns jsonb
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', l.id, 'code', l.code, 'name', l.name, 'device_code', l.device_code, 'device_model', l.device_model,
      'licence_until', l.licence_until, 'forever', l.licence_forever, 'revoked', l.revoked_at is not null,
      'trial_days', l.trial_days,
      'activated_at', l.activated_at, 'last_seen_at', l.last_seen_at, 'created_at', l.created_at,
      'playlists', coalesce(b.playlists, 0)
    ) order by l.created_at desc)
    from public.carito_licences l left join public.carito_licence_libraries b on b.licence_id = l.id
  ), '[]'::jsonb);
end;
$$;

-- Crear: además de la fecha o "sin límite", una prueba de [p_trial_days] días que empieza al escribirla.
drop function public.carito_owner_create(text, text, text, date, boolean);
create function public.carito_owner_create(p_token text, p_name text, p_device text, p_until date, p_forever boolean, p_trial_days smallint default null)
returns text
language plpgsql volatile security definer set search_path = public
as $$
declare
  v_code text;
  v_trial boolean := p_trial_days is not null;
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  if p_device is not null and p_device !~ '^[0-9A-HJKMNP-TV-Z]{5}$' then raise exception 'bad_device' using errcode = '22023'; end if;
  if v_trial and (p_trial_days < 1 or p_trial_days > 30) then raise exception 'bad_trial' using errcode = '22023'; end if;
  if not v_trial and not coalesce(p_forever, false) and p_until is null then raise exception 'no_length' using errcode = '22023'; end if;
  v_code := public.carito_new_code();
  insert into public.carito_licences (code, name, device_code, licence_until, licence_forever, trial_days, source)
  values (
    v_code, left(trim(coalesce(p_name, '')), 60), p_device,
    case when v_trial or coalesce(p_forever, false) then null else p_until end,
    not v_trial and coalesce(p_forever, false),
    case when v_trial then p_trial_days end,
    'app'
  );
  return v_code;
end;
$$;

-- Cambiar la fecha (o poner "sin límite") a una prueba la convierte en licencia.
create or replace function public.carito_owner_update(p_token text, p_id uuid, p_until date, p_forever boolean, p_revoked boolean)
returns void
language plpgsql volatile security definer set search_path = public
as $$
begin
  if not public.carito_owner_check(p_token) then raise exception 'not_owner' using errcode = '42501'; end if;
  update public.carito_licences
     set licence_until = case when p_forever is true then null when p_until is not null then p_until else licence_until end,
         licence_forever = case when p_forever is true then true when p_until is not null then false else licence_forever end,
         trial_days = case when p_forever is true or p_until is not null then null else trial_days end,
         revoked_at = case when p_revoked is true then coalesce(revoked_at, now()) when p_revoked is false then null else revoked_at end
   where id = p_id;
end;
$$;

revoke execute on function public.carito_owner_create(text, text, text, date, boolean, smallint) from public;
grant execute on function public.carito_owner_create(text, text, text, date, boolean, smallint) to anon, authenticated;
