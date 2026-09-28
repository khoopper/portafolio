-- First-party visit metrics: no cookies, no IP. `visitor` is a per-day salted hash, so it can count
-- unique visitors within one day but cannot be linked across days or reversed to an address.
-- Only the server (service_role) writes and reads; visitors and logged-in users get no access.

create table if not exists public.site_events (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  kind         text not null check (kind in ('view', 'cv', 'demo', 'repo', 'contact')),
  path         text not null check (char_length(path) between 1 and 200),
  project_slug text check (char_length(project_slug) between 1 and 80),
  country      text check (country ~ '^[A-Z]{2}$'),
  device       text not null check (device in ('mobile', 'tablet', 'desktop')),
  visitor      text not null check (char_length(visitor) = 32)
);

create index if not exists site_events_created_at_idx on public.site_events (created_at desc);

alter table public.site_events enable row level security;
revoke all on public.site_events from anon, authenticated;

-- One call returns everything the admin dashboard shows. "Today" follows El Salvador time.
create or replace function public.site_stats(p_days integer default 30)
returns jsonb
language sql
stable
set search_path = public
as $$
  with tz as (
    select (now() at time zone 'America/El_Salvador')::date as today
  ),
  ev as (
    select e.kind, e.path, e.country, e.device, e.visitor, e.created_at, e.project_slug,
           (e.created_at at time zone 'America/El_Salvador')::date as day
    from public.site_events e
    where e.created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select jsonb_build_object(
    'views_today',    (select count(*) from ev, tz where ev.kind = 'view' and ev.day = tz.today),
    'views_7d',       (select count(*) from ev, tz where ev.kind = 'view' and ev.day > tz.today - 7),
    'views_30d',      (select count(*) from ev where ev.kind = 'view'),
    'visitors_today', (select count(distinct ev.visitor) from ev, tz where ev.kind = 'view' and ev.day = tz.today),
    'visitor_days_7d',(select count(distinct (ev.day, ev.visitor)) from ev, tz where ev.kind = 'view' and ev.day > tz.today - 7),
    'by_day', (
      select coalesce(jsonb_agg(
        jsonb_build_object('day', (tz.today - g.i)::text, 'views', coalesce(v.views, 0), 'visitors', coalesce(v.visitors, 0))
        order by g.i desc), '[]'::jsonb)
      from tz
      cross join generate_series(0, 13) as g(i)
      left join (
        select ev.day, count(*) as views, count(distinct ev.visitor) as visitors
        from ev where ev.kind = 'view' group by ev.day
      ) v on v.day = tz.today - g.i
    ),
    'top_pages', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select ev.path, count(*) as views from ev where ev.kind = 'view'
            group by ev.path order by count(*) desc, ev.path limit 8) t
    ),
    'countries', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select ev.country, count(*) as views from ev where ev.kind = 'view' and ev.country is not null
            group by ev.country order by count(*) desc, ev.country limit 8) t
    ),
    'devices', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select ev.device, count(*) as views from ev where ev.kind = 'view'
            group by ev.device order by count(*) desc, ev.device) t
    ),
    'clicks', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select ev.kind, count(*) as total from ev where ev.kind <> 'view'
            group by ev.kind order by count(*) desc, ev.kind) t
    ),
    'recent', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select ev.created_at, ev.kind, ev.path, ev.country, ev.device from ev
            order by ev.created_at desc limit 25) t
    )
  );
$$;

revoke all on function public.site_stats(integer) from public, anon, authenticated;
grant execute on function public.site_stats(integer) to service_role;
