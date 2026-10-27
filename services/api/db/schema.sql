-- ==============================================================================
-- SuperSave Production Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- 2. Content Items Table (Stores all 14 intelligence dimensions)
create table if not exists content_items (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  status text not null default 'processing', -- 'processing' | 'ready' | 'failed'
  title text not null default '',
  content_type text default 'general',
  category text not null default 'General',
  subcategory text default '',
  summary text not null default '',
  summary_detail jsonb default '{}'::jsonb,
  notes text not null default '',
  tags text[] not null default '{}',
  key_takeaways text[] not null default '{}',
  chapters jsonb default '[]'::jsonb,
  visual_insights jsonb default '{}'::jsonb,
  code_snippets jsonb default '[]'::jsonb,
  detected_resources jsonb default '[]'::jsonb,
  detected_products jsonb default '[]'::jsonb,
  facts_and_claims jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  action_items text[] not null default '{}',
  personal_note text not null default '',
  source text not null default 'Web', -- 'Instagram' | 'YouTube' | 'Upload' | 'Web' | 'Pinterest'
  duration text,
  thumbnail text,
  embed_url text,
  extraction_mode text default 'video_lowres',
  data jsonb not null default '{}'::jsonb, -- complete canonical item snapshot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Q&A Chat Messages Table
create table if not exists qa_messages (
  id uuid primary key default gen_random_uuid(),
  content_id text not null references content_items(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

-- 4. Collections Table
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  icon text default '📁',
  is_smart boolean default false,
  rules jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. Performance & Full-Text Search Indices
create index if not exists content_items_user_idx on content_items(user_id, created_at desc);
create index if not exists content_items_status_idx on content_items(status);
create index if not exists content_items_category_idx on content_items(category);
create index if not exists content_items_created_idx on content_items(created_at desc);

-- Full-Text Search across Title, Summary, and Notes
create index if not exists content_items_search_idx on content_items using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(notes, ''))
);

-- Dedicated GIN index for tags array filtering
create index if not exists content_items_tags_idx on content_items using gin (tags);

-- 6. Row Level Security (RLS)
alter table content_items enable row level security;
alter table qa_messages enable row level security;
alter table collections enable row level security;

-- Policies for content_items
create policy "Users can view own items or public demo items"
  on content_items for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert own items"
  on content_items for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update own items"
  on content_items for update
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete own items"
  on content_items for delete
  using (auth.uid() = user_id or user_id is null);

-- Policies for qa_messages
create policy "Users can view own QA messages"
  on qa_messages for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert QA messages"
  on qa_messages for insert
  with check (auth.uid() = user_id or user_id is null);

-- Policies for collections
create policy "Users can manage own collections"
  on collections for all
  using (auth.uid() = user_id or user_id is null);
