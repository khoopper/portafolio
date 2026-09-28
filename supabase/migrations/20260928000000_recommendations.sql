-- Recomendaciones verificadas de clientes

create table public.recommendation_invites (
  id           uuid primary key default gen_random_uuid(),
  project_slug text not null,
  note         text not null check (char_length(note) between 1 and 120),
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create table public.recommendations (
  id           uuid primary key,
  invite_id    uuid not null unique references public.recommendation_invites(id),
  project_slug text not null,
  provider     text not null check (provider in ('google', 'linkedin_oidc')),
  provider_sub text not null,
  name         text not null,
  avatar_path  text,
  email        text not null,
  email_domain text,
  role         text not null check (char_length(role) between 2 and 80),
  company      text not null check (char_length(company) between 2 and 80),
  body         text not null check (char_length(body) between 30 and 800),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  unique (provider, provider_sub, project_slug)
);

create index recommendations_project_status_idx on public.recommendations (project_slug, status);

-- RLS on, no policies: the browser can't touch these tables. The Next server uses service_role.
alter table public.recommendation_invites enable row level security;
alter table public.recommendations enable row level security;
revoke all on public.recommendation_invites, public.recommendations from anon, authenticated;

-- Public read: approved only, never email or provider_sub.
create view public.public_recommendations
with (security_invoker = false) as
select id, project_slug, provider, name, avatar_path, email_domain, role, company, body, created_at
from public.recommendations
where status = 'approved';

-- The view is auto-updatable and runs as its owner (bypassing the tables' RLS), and Supabase's
-- default privileges grant ALL on new public objects. Strip everything, then allow read only.
revoke all on public.public_recommendations from public, anon, authenticated;
grant select on public.public_recommendations to anon, authenticated;

-- Consume the invite and insert the recommendation in one transaction:
-- two tabs racing on one link → only one wins; any failure leaves the link unused.
create function public.submit_recommendation(
  p_id uuid, p_token_hash text, p_provider text, p_provider_sub text, p_name text, p_email text,
  p_email_domain text, p_role text, p_company text, p_body text, p_avatar_path text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.recommendation_invites;
begin
  update public.recommendation_invites
     set used_at = now()
   where token_hash = p_token_hash
     and used_at is null
     and revoked_at is null
     and expires_at > now()
  returning * into v_invite;

  if not found then
    raise exception 'invite_unavailable' using errcode = 'P0001';
  end if;

  insert into public.recommendations
    (id, invite_id, project_slug, provider, provider_sub, name, avatar_path, email, email_domain, role, company, body)
  values
    (p_id, v_invite.id, v_invite.project_slug, p_provider, p_provider_sub, p_name, p_avatar_path, p_email, p_email_domain, p_role, p_company, p_body);

  return p_id;
end;
$$;

revoke execute on function public.submit_recommendation(uuid, text, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_recommendation(uuid, text, text, text, text, text, text, text, text, text, text)
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recommendation-avatars', 'recommendation-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
