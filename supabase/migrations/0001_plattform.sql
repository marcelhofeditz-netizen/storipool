-- Selfpublishbot-Plattform (27.11.2026): gleiches Gerüst wie Elsterbot/Finanzenbot – OAuth für Claude/ChatGPT,
-- Protokoll ohne Inhalte, Zustimmungen. Bücher gehören jetzt einem Konto (user_id); Bücher mit Schlüssel aus dem
-- ersten Connector bleiben gültig und lassen sich ins Konto übernehmen.
-- Alle neuen Tabellen nur über den Service-Client (RLS an, keine Policies, keine Rechte für anon/authenticated).

create table if not exists public.oauth_clients (
  client_id text primary key,
  client_name text,
  redirect_uris text[] not null,
  client_kind text check (client_kind in ('claude', 'chatgpt', 'other')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.oauth_codes (
  code_hash text primary key,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redirect_uri text not null,
  code_challenge text not null,
  resource text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  label text,
  oauth_client_id text references public.oauth_clients (client_id) on delete set null,
  client_kind text,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists api_tokens_user_idx on public.api_tokens (user_id) where revoked_at is null;

create table if not exists public.oauth_refresh_tokens (
  token_hash text primary key,
  family_id uuid not null,
  api_token_id uuid references public.api_tokens (id) on delete set null,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  resource text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists oauth_refresh_tokens_family_idx on public.oauth_refresh_tokens (family_id);

-- Protokoll der Tool-Aufrufe – nie Buchtexte, nur Werkzeug und Buch-ID
create table if not exists public.tool_calls (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  tool text not null,
  ok boolean not null,
  args jsonb,
  client_kind text,
  created_at timestamptz not null default now()
);
create index if not exists tool_calls_user_idx on public.tool_calls (user_id, created_at desc);

-- Zustimmung zu AGB und Datenschutz (Version, Kanal)
create table if not exists public.selfpublishbot_zustimmungen (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  agb_version text not null,
  datenschutz_version text not null,
  kanal text not null check (kanal in ('web', 'app', 'connector')),
  created_at timestamptz not null default now()
);
create index if not exists selfpublishbot_zustimmungen_user_idx on public.selfpublishbot_zustimmungen (user_id);


alter table public.spb_buecher add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.spb_buecher alter column key_hash drop not null;
alter table public.spb_buecher add column if not exists genre text;
create index if not exists spb_buecher_user_idx on public.spb_buecher (user_id, updated_at desc) where user_id is not null;

do $$
declare t text;
begin
  foreach t in array array['oauth_clients','oauth_codes','api_tokens','oauth_refresh_tokens','tool_calls','selfpublishbot_zustimmungen'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
