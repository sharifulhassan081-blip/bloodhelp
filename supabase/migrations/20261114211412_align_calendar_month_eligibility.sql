-- Match the app's four-calendar-month, end-of-month-clamped calculation.
create or replace view public.public_donors with (security_barrier = true) as
select p.id, p.name, p.phone, p.blood_group, p.gender, p.area
from public.donor_profiles p
where p.public_consent and p.available and not p.diseases and p.weight >= 50
  and p.date_of_birth <= (timezone('Asia/Dhaka', now())::date - interval '18 years')::date
  and coalesce((greatest(p.last_donation_date,
       (select max(d.donated_on) from public.donations d where d.owner_id = p.owner_id)) + interval '4 months')::date,
       '1900-01-01'::date) <= timezone('Asia/Dhaka', now())::date;
create or replace function public.record_donation_availability() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.donor_profiles
    set last_donation_date = greatest(last_donation_date, new.donated_on),
        available = case when (new.donated_on + interval '4 months')::date > timezone('Asia/Dhaka', now())::date then false else available end
    where owner_id = new.owner_id;
  return new;
end;
$$;
