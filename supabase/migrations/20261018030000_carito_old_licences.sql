-- Carito Music: las licencias de antes (app 2.2 a 2.5), de 8 caracteres.
--
-- Hasta la 2.5 el dueño le dio a cada amigo una licencia de 8 caracteres («TJGM-ZY82») hecha con el código de su teléfono, sin fecha
-- de vencimiento. La importación de la 2.6 las subió con otro texto (el «ZZZ-…» que mostraba la 2.6), que ellos nunca recibieron.
-- Desde aquí una licencia puede tener 8 caracteres, y la importación guarda el texto que el amigo tiene ("old"), también en lugar del
-- que ya había subido. La app 2.7.5 manda "old"; las anteriores no, y siguen igual.
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
