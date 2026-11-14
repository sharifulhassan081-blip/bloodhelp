-- Bloodhelp live data. Only the deliberately limited views are public.
create table public.donor_profiles (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null unique default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  phone text not null check (phone ~ '^01[0-9]{9}$'),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  date_of_birth date not null check (date_of_birth between '1900-01-01' and (timezone('Asia/Dhaka', now())::date - interval '18 years')::date),
  gender text not null check (gender in ('Male','Female','Other')),
  area text not null check (char_length(btrim(area)) between 1 and 80),
  last_donation_date date check (last_donation_date is null or last_donation_date <= timezone('Asia/Dhaka', now())::date),
  weight smallint not null check (weight between 1 and 300),
  diseases boolean not null,
  emergency boolean not null default true,
  available boolean not null default false,
  public_consent boolean not null check (public_consent),
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.donor_profiles(owner_id) on delete cascade,
  donated_on date not null check (donated_on between '1900-01-01' and timezone('Asia/Dhaka', now())::date),
  location text not null check (char_length(btrim(location)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  patient text not null check (char_length(btrim(patient)) between 1 and 80),
  hospital text not null check (char_length(btrim(hospital)) between 1 and 120),
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  units smallint not null check (units between 1 and 4),
  units_received smallint not null default 0 check (units_received >= 0 and units_received <= units),
  needed_by date not null check (needed_by between timezone('Asia/Dhaka', now())::date and (timezone('Asia/Dhaka', now())::date + 365)),
  phone text not null check (phone ~ '^01[0-9]{9}$'),
  area text not null check (char_length(btrim(area)) between 1 and 80),
  note text not null default '' check (char_length(note) <= 500),
  public_consent boolean not null check (public_consent),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index donations_owner_date_idx on public.donations (owner_id, donated_on desc);
create index requests_expiry_idx on public.blood_requests (expires_at desc);
create index donors_search_idx on public.donor_profiles (blood_group, area) where available and public_consent;

alter table public.donor_profiles enable row level security;
alter table public.donations enable row level security;
alter table public.blood_requests enable row level security;
create policy donor_owner on public.donor_profiles for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy donation_owner on public.donations for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy request_owner on public.blood_requests for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Revoke Supabase's default table privileges. User IDs and sensitive fields never
-- appear in the public views; column grants prevent forging IDs or timestamps.
revoke all on public.donor_profiles, public.donations, public.blood_requests from anon, authenticated;
grant select, delete on public.donor_profiles, public.donations, public.blood_requests to authenticated;
grant insert (name, phone, blood_group, date_of_birth, gender, area, last_donation_date, weight, diseases, emergency, available, public_consent)
  on public.donor_profiles to authenticated;
grant update (name, phone, blood_group, date_of_birth, gender, area, last_donation_date, weight, diseases, emergency, available, public_consent)
  on public.donor_profiles to authenticated;
grant insert (donated_on, location) on public.donations to authenticated;
grant insert (patient, hospital, blood_group, units, needed_by, phone, area, note, public_consent)
  on public.blood_requests to authenticated;
grant update (units_received) on public.blood_requests to authenticated;

-- These owner-executed security-barrier views intentionally bypass base-table
-- RLS to publish only consented, available/active records and the columns below.
create view public.public_donors with (security_barrier = true) as
select p.id, p.name, p.phone, p.blood_group, p.gender, p.area
from public.donor_profiles p
where p.public_consent and p.available and not p.diseases and p.weight >= 50
  and p.date_of_birth <= (timezone('Asia/Dhaka', now())::date - interval '18 years')::date
  and coalesce(greatest(p.last_donation_date,
       (select max(d.donated_on) from public.donations d where d.owner_id = p.owner_id)), '1900-01-01'::date)
       <= (timezone('Asia/Dhaka', now())::date - interval '4 months')::date;
create view public.public_requests with (security_barrier = true) as
select id, patient, hospital, blood_group, units, units_received, needed_by, phone, area, note, created_at, expires_at
from public.blood_requests
where public_consent and expires_at > now() and units_received < units;
revoke all on public.public_donors, public.public_requests from public;
grant select on public.public_donors, public.public_requests to anon, authenticated;
