-- PostgreSQL schema for the persistent MVP.
-- user_id should map to the authenticated user's id (e.g. Supabase auth.users.id).

create extension if not exists pg_trgm;

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  source_url text not null,
  source_platform text not null default 'web',
  status text not null default 'processing',
  title text not null default '',
  summary text not null default '',
  category text not null default 'General',
  notes_markdown text not null default '',
  transcript text not null default '',
  tags text[] not null default '{}',
  key_takeaways text[] not null default '{}',
  thumbnail_url text,
  duration_seconds integer,
  personal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_user_created_idx on content_items(user_id, created_at desc);
create index if not exists content_items_search_idx on content_items using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(notes_markdown,'') || ' ' || array_to_string(tags, ' ')));

create table if not exists qa_messages (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content_items(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists qa_messages_content_created_idx on qa_messages(content_id, created_at);
