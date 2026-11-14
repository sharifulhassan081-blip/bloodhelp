-- Publish the emergency-contact preference alongside the other consented fields.
create or replace view public.public_donors with (security_barrier = true) as
select p.id, p.name, p.phone, p.blood_group, p.gender, p.area, p.emergency
from public.donor_profiles p
where p.public_consent and p.available and not p.diseases and p.weight >= 50
  and p.date_of_birth <= (timezone('Asia/Dhaka', now())::date - interval '18 years')::date
  and coalesce((greatest(p.last_donation_date,
       (select max(d.donated_on) from public.donations d where d.owner_id = p.owner_id)) + interval '4 months')::date,
       '1900-01-01'::date) <= timezone('Asia/Dhaka', now())::date;
