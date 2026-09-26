-- Phase 8: flat inbox ($0 manual-first, avoids FK sprawl).
create table if not exists inbox_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  handle text default '',
  platform text default '',
  comment_text text default '',
  is_lead boolean default false,
  lead_score numeric default 0,
  reply_text text default '',
  reply_action text default 'escalate',
  status text default 'new',
  follow_up_at timestamptz,
  follow_up_count int default 0,
  created_at timestamptz default now()
);
