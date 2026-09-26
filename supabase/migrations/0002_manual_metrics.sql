-- Phase 6: manual-first metrics (Remind Me publish). Avoids post_metrics FK wart.
create table if not exists manual_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  platform text default '',
  caption text default '',
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  clicks int default 0,
  created_at timestamptz default now()
);
