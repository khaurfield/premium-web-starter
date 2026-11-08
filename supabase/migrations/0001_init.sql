-- Foundation schema for the personal AI assistant.
-- Target: Supabase Postgres (provides the `auth` schema and `auth.uid()`).
-- This file is intentionally inert until you apply it: no tables are created
-- by `npm run build`. Keep it in version control and apply it once per project.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector with schema extensions;

-- Shared trigger helper -----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tables --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null,
  token_count integer,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  source_uri text,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null
    references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- Indexes -------------------------------------------------------------------
create index if not exists conversations_user_id_created_at_idx
  on public.conversations (user_id, created_at desc);
create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);
create index if not exists documents_user_id_idx
  on public.documents (user_id);
create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);
-- An HNSW/IVFFlat ANN index is intentionally deferred until real embeddings
-- exist; adding one to an empty table wastes build time.

-- Triggers ------------------------------------------------------------------
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- Row Level Security --------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists conversations_owner_all on public.conversations;
create policy conversations_owner_all on public.conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists messages_owner_all on public.messages;
create policy messages_owner_all on public.messages
  for all to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists documents_owner_all on public.documents;
create policy documents_owner_all on public.documents
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists document_chunks_owner_all on public.document_chunks;
create policy document_chunks_owner_all on public.document_chunks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
