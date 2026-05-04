drop table if exists public.app_state;

create table public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.app_state (id, payload, updated_at)
values (
  'global',
  '{"users":[{"id":"admin","nom":"Administrateur","identifiant":"admin","motDePasse":"admin","role":"admin"},{"id":"mokrane","nom":"Mokrane","identifiant":"mokrane","motDePasse":"admin","role":"admin"}],"fiches":[],"devis":[],"archivesJour":[],"lastClosureDate":""}',
  now()
);

alter table public.app_state disable row level security;
grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.app_state to anon;
grant select, insert, update, delete on table public.app_state to authenticated;
