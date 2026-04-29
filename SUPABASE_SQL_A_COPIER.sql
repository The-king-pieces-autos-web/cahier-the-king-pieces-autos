-- À copier dans Supabase > SQL Editor > New query > Run

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id, payload, updated_at)
values (
  'global',
  '{"users":[{"id":"admin","nom":"Administrateur","identifiant":"admin","motDePasse":"admin","role":"admin"},{"id":"poste1","nom":"Poste 1","identifiant":"poste1","motDePasse":"1234","role":"salarie"},{"id":"poste2","nom":"Poste 2","identifiant":"poste2","motDePasse":"1234","role":"salarie"},{"id":"poste3","nom":"Poste 3","identifiant":"poste3","motDePasse":"1234","role":"salarie"}],"fiches":[]}',
  now()
)
on conflict (id) do nothing;

alter table public.app_state disable row level security;

-- Realtime optionnel mais conseillé :
-- Supabase > Database > Replication > active Realtime sur la table app_state.
