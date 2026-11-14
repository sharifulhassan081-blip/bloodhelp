-- Recording a recent donation atomically updates the private last date and
-- switches off availability. A donor must explicitly turn it back on later.
create function public.record_donation_availability() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.donor_profiles
    set last_donation_date = greatest(last_donation_date, new.donated_on),
        available = case when new.donated_on > (timezone('Asia/Dhaka', now())::date - interval '4 months')::date then false else available end
    where owner_id = new.owner_id;
  return new;
end;
$$;
revoke all on function public.record_donation_availability() from public, anon, authenticated;
create trigger donation_updates_profile after insert on public.donations for each row execute function public.record_donation_availability();
