-- Adds the visitor funnel to public.site_stats(): entry pages, exit pages (where visitors leave) and
-- single-page visits. A "visit" is one visitor id on one day (the id is a per-day hash, no IP, no cookie).
-- Replaces the function from 20260929000000_site_events.sql; run this file once in the Supabase SQL Editor.

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
  ),
  visits as (
    select ev.day, ev.visitor,
           count(*) as views,
           (array_agg(ev.path order by ev.created_at asc))[1]  as entry_path,
           (array_agg(ev.path order by ev.created_at desc))[1] as exit_path
    from ev
    where ev.kind = 'view'
    group by ev.day, ev.visitor
  )
  select jsonb_build_object(
    'views_today',    (select count(*) from ev, tz where ev.kind = 'view' and ev.day = tz.today),
    'views_7d',       (select count(*) from ev, tz where ev.kind = 'view' and ev.day > tz.today - 7),
    'views_30d',      (select count(*) from ev where ev.kind = 'view'),
    'visitors_today', (select count(distinct ev.visitor) from ev, tz where ev.kind = 'view' and ev.day = tz.today),
    'visitor_days_7d',(select count(distinct (ev.day, ev.visitor)) from ev, tz where ev.kind = 'view' and ev.day > tz.today - 7),
    'visits',             (select count(*) from visits),
    'single_page_visits', (select count(*) from visits where visits.views = 1),
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
    'entry_pages', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select visits.entry_path as path, count(*) as visits from visits
            group by visits.entry_path order by count(*) desc, visits.entry_path limit 8) t
    ),
    'exit_pages', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from (select visits.exit_path as path, count(*) as visits from visits
            group by visits.exit_path order by count(*) desc, visits.exit_path limit 8) t
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
