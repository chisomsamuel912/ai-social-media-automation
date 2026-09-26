-- Auth hardening: owner-only row access. Service key bypasses RLS (server routes keep working).
alter table businesses enable row level security;
alter table content_profiles enable row level security;
alter table brands enable row level security;
alter table media_assets enable row level security;
alter table verified_facts enable row level security;
alter table content_ideas enable row level security;
alter table posts enable row level security;
alter table post_variants enable row level security;
alter table manual_metrics enable row level security;
alter table inbox_items enable row level security;
alter table learnings enable row level security;

create policy "owners read own business" on businesses for select using (auth.uid() = owner_id);
create policy "owners manage own business" on businesses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owners read own profile" on content_profiles for select using (
  exists (select 1 from businesses b where b.id = content_profiles.business_id and b.owner_id = auth.uid()));
create policy "owners manage own profile" on content_profiles for all using (
  exists (select 1 from businesses b where b.id = content_profiles.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = content_profiles.business_id and b.owner_id = auth.uid()));

create policy "owners read own brand" on brands for select using (
  exists (select 1 from businesses b where b.id = brands.business_id and b.owner_id = auth.uid()));
create policy "owners manage own brand" on brands for all using (
  exists (select 1 from businesses b where b.id = brands.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = brands.business_id and b.owner_id = auth.uid()));
