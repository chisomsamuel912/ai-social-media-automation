-- Fix: tables referenced by plan/learn routes but missing from 0001.
create table if not exists content_history (
  business_id uuid references businesses(id) on delete cascade,
  topic text default '',
  angle text default '',
  hook text default '',
  format text default '',
  platform text default '',
  created_at timestamptz default now()
);
create table if not exists learnings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  insight_text text default '',
  confidence numeric default 0,
  applied_count int default 0,
  created_at timestamptz default now()
);
alter table content_history enable row level security;
alter table learnings enable row level security;
create policy "owners read own history" on content_history for select using (
  exists (select 1 from businesses b where b.id = content_history.business_id and b.owner_id = auth.uid()));
create policy "owners manage own history" on content_history for all using (
  exists (select 1 from businesses b where b.id = content_history.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = content_history.business_id and b.owner_id = auth.uid()));
create policy "owners read own learnings" on learnings for select using (
  exists (select 1 from businesses b where b.id = learnings.business_id and b.owner_id = auth.uid()));
create policy "owners manage own learnings" on learnings for all using (
  exists (select 1 from businesses b where b.id = learnings.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = learnings.business_id and b.owner_id = auth.uid()));
