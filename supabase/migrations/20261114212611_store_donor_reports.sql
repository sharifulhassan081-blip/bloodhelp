-- Reports are private to their author and project administrators; no automatic
-- review or notification is implied. One report per author/donor limits repeats.
create table public.donor_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  donor_id uuid not null references public.donor_profiles(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 10 and 500),
  created_at timestamptz not null default now(),
  unique (owner_id, donor_id)
);
alter table public.donor_reports enable row level security;
create policy report_owner on public.donor_reports for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on public.donor_reports from anon, authenticated;
grant select, delete on public.donor_reports to authenticated;
grant insert (donor_id, reason) on public.donor_reports to authenticated;
