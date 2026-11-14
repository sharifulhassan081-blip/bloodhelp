-- A request created shortly before midnight must remain editable the next day.
alter table public.blood_requests drop constraint blood_requests_needed_by_check;
alter table public.blood_requests add constraint blood_requests_needed_by_check
  check (needed_by between timezone('Asia/Dhaka', created_at)::date and (timezone('Asia/Dhaka', created_at)::date + 365));
