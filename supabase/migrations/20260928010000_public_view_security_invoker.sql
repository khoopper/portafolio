-- Make public_recommendations run with the caller's permissions (security_invoker) instead of the
-- owner's, so RLS applies through it and Supabase no longer flags it as UNRESTRICTED.
-- Visitors can then read exactly: approved rows, and only the non-private columns below.

alter view public.public_recommendations set (security_invoker = true);

-- Column-level read access: never email, provider_sub or invite_id.
grant select (id, project_slug, provider, name, avatar_path, email_domain, role, company, body, created_at, status)
  on public.recommendations to anon, authenticated;

-- Row-level: only approved recommendations are visible.
create policy "Recomendaciones aprobadas son públicas"
  on public.recommendations
  for select
  to anon, authenticated
  using (status = 'approved');
