create table if not exists public.emergency_cases (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  patient_name text not null,
  condition text not null,
  priority text not null check (priority in ('Critical', 'Urgent', 'Standard')),
  status text not null default 'new' check (status in ('new', 'dispatched', 'in_care', 'closed')),
  facility text not null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists emergency_cases_assigned_to_idx on public.emergency_cases(assigned_to);
create index if not exists emergency_cases_status_idx on public.emergency_cases(status);
alter table public.emergency_cases enable row level security;

drop policy if exists "Staff can read assigned emergency cases" on public.emergency_cases;
create policy "Staff can read assigned emergency cases" on public.emergency_cases for select to authenticated
  using (assigned_to = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'));

drop policy if exists "Staff can update assigned emergency cases" on public.emergency_cases;
create policy "Staff can update assigned emergency cases" on public.emergency_cases for update to authenticated
  using (assigned_to = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'))
  with check (assigned_to = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'));

drop policy if exists "Coordinators can insert referral holds" on public.referral_holds;
create policy "Coordinators can insert referral holds" on public.referral_holds for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'));
drop policy if exists "Coordinators can update referral holds" on public.referral_holds;
create policy "Coordinators can update referral holds" on public.referral_holds for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'))
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'));
drop policy if exists "Coordinators can delete referral holds" on public.referral_holds;
create policy "Coordinators can delete referral holds" on public.referral_holds for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'coordinator'));

grant select, update on public.emergency_cases to authenticated;
grant all on public.emergency_cases to service_role;
