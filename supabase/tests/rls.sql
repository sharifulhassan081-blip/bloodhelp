-- Run as a database administrator against a non-production or carefully
-- controlled project. All generated users and data are rolled back at the end.
begin;
create temp table bh_test_users as select gen_random_uuid() as a, gen_random_uuid() as b;
grant select on bh_test_users to anon, authenticated;
insert into auth.users (id, email, email_confirmed_at)
select a, 'test-' || a::text || '@example.invalid', now() from bh_test_users
union all select b, 'test-' || b::text || '@example.invalid', now() from bh_test_users;

do $$ begin
  if has_table_privilege('anon','public.donor_profiles','select')
     or has_table_privilege('anon','public.blood_requests','select')
     or has_table_privilege('anon','public.donor_reports','select')
     or has_column_privilege('authenticated','public.blood_requests','owner_id','insert')
     or has_column_privilege('authenticated','public.blood_requests','expires_at','insert')
     or has_function_privilege('anon','public.delete_my_account()','execute')
  then raise exception 'Unexpected privilege'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select a::text from bh_test_users), true);
insert into public.donor_profiles (name, phone, blood_group, date_of_birth, gender, area, weight, diseases, emergency, available, public_consent)
select 'Test ' || a::text, '01712345678', 'O+', '1990-01-01', 'Other', 'Zindabazar', 60, false, true, true, true from bh_test_users;
insert into public.blood_requests (patient, hospital, blood_group, units, needed_by, phone, area, note, public_consent)
select 'Test ' || a::text, 'Test hospital', 'O+', 2, timezone('Asia/Dhaka', now())::date, '01712345678', 'Zindabazar', '', true from bh_test_users;
set local role anon;
do $$ begin
  if not exists (select 1 from public.public_donors where name = (select 'Test ' || a::text from bh_test_users)) then raise exception 'Public donor missing'; end if;
  if not exists (select 1 from public.public_requests where patient = (select 'Test ' || a::text from bh_test_users)) then raise exception 'Public request missing'; end if;
  begin perform * from public.donor_profiles; raise exception 'Anonymous user read private table'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select b::text from bh_test_users), true);
do $$ declare changed integer; begin
  if exists (select 1 from public.donor_profiles) or exists (select 1 from public.blood_requests) then raise exception 'Another user read private data'; end if;
  update public.blood_requests set units_received = 1; get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Another user updated a request'; end if;
end $$;
insert into public.donor_reports (donor_id, reason)
select id, 'Test concern about a number' from public.public_donors where name = (select 'Test ' || a::text from bh_test_users);
do $$ begin if (select count(*) from public.donor_reports) <> 1 then raise exception 'Reporter cannot see their report'; end if; end $$;
select set_config('request.jwt.claim.sub', (select a::text from bh_test_users), true);
do $$ begin if exists (select 1 from public.donor_reports) then raise exception 'Another user can see the report'; end if; end $$;
update public.blood_requests set units_received = 2;
set local role anon;
do $$ begin if exists (select 1 from public.public_requests where patient = (select 'Test ' || a::text from bh_test_users)) then raise exception 'Fulfilled request visible'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select a::text from bh_test_users), true);
update public.blood_requests set units_received = 1;
insert into public.donations (donated_on, location) values (timezone('Asia/Dhaka', now())::date, 'Test hospital');
do $$ begin if (select available from public.donor_profiles) then raise exception 'Donation did not switch availability off'; end if; end $$;
set local role anon;
do $$ begin if exists (select 1 from public.public_donors where name = (select 'Test ' || a::text from bh_test_users)) then raise exception 'Unavailable donor visible'; end if; end $$;
reset role;
update public.blood_requests set expires_at = now() - interval '1 second' where owner_id = (select a from bh_test_users);
set local role anon;
do $$ begin if exists (select 1 from public.public_requests where patient = (select 'Test ' || a::text from bh_test_users)) then raise exception 'Expired request visible'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select a::text from bh_test_users), true);
select public.delete_my_account();
reset role;
do $$ begin
  if exists (select 1 from auth.users where id = (select a from bh_test_users)) or exists (select 1 from public.blood_requests where owner_id = (select a from bh_test_users)) or exists (select 1 from public.donor_profiles where owner_id = (select a from bh_test_users)) or exists (select 1 from public.donor_reports where owner_id = (select b from bh_test_users)) then raise exception 'Account deletion did not cascade'; end if;
  if not exists (select 1 from auth.users where id = (select b from bh_test_users)) then raise exception 'Account deletion affected another user'; end if;
end $$;
rollback;
