-- Phase 2 v1: $0 MVP core tables (no ORM, SQL only). pgvector deferred.
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  name text not null,
  description text default '',
  sales_channels text[] default '{}',
  publishing_mode text default 'remind_me',
  posting_frequency text default 'let_ai_decide',
  created_at timestamptz default now()
);
create table if not exists content_profiles (
  business_id uuid primary key references businesses(id) on delete cascade,
  audience_json jsonb default '{}',
  tone text default 'friendly',
  topics text[] default '{}',
  avoid_topics text[] default '{}',
  goals text[] default '{}',
  important_dates jsonb default '[]'
);
create table if not exists brands (
  business_id uuid primary key references businesses(id) on delete cascade,
  logo_url text,
  colors text[] default '{}',
  visual_style text default '',
  writing_style text default '',
  avoid_list text[] default '{}'
);
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  url text not null,
  type text default 'image',
  tags text[] default '{}',
  created_at timestamptz default now()
);
create table if not exists verified_facts (
  business_id uuid references businesses(id) on delete cascade,
  key text not null,
  value text not null,
  source text default 'owner',
  primary key (business_id, key)
);
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  topic text not null,
  angle text default '',
  format text default 'Image',
  pillar text default 'value',
  event_ref text default '',
  status text default 'draft',
  created_at timestamptz default now()
);
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  idea_id uuid references content_ideas(id) on delete set null,
  status text default 'draft',
  scheduled_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists post_variants (
  post_id uuid references posts(id) on delete cascade,
  platform text not null,
  caption text default '',
  hashtags text[] default '{}',
  script text default '',
  media_url text default '',
  status text default 'draft',
  primary key (post_id, platform)
);
create table if not exists app_logs (
  created_at timestamptz default now(),
  level text default 'info',
  scope text default 'app',
  message text default '',
  meta jsonb default '{}'
);
-- RLS: enable, owner-only policies added after Supabase Auth wiring (Phase 2 exit).
