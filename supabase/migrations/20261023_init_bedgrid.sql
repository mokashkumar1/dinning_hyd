create table public.hospitals (
  id text primary key,
  name_en text not null,
  name_ur text not null,
  name_sd text not null,
  area text not null,
  category text not null check (category in ('Govt Tertiary', 'Academic Teaching', 'Private/Charitable', 'Specialized Center')),
  distance_km numeric(5, 2) not null check (distance_km >= 0),
  eta_mins integer not null check (eta_mins >= 0),
  emergency_phone text not null,
  latitude numeric(8, 5) not null check (latitude between -90 and 90),
  longitude numeric(8, 5) not null check (longitude between -180 and 180),
  total_beds integer not null check (total_beds >= 0),
  available_beds integer not null check (available_beds between 0 and total_beds),
  total_icu integer not null check (total_icu >= 0),
  available_icu integer not null check (available_icu between 0 and total_icu),
  total_vents integer not null check (total_vents >= 0),
  available_vents integer not null check (available_vents between 0 and total_vents),
  oxygen_beds integer not null check (oxygen_beds >= 0),
  trauma_level smallint not null check (trauma_level in (1, 2, 3)),
  specialties text[] not null default '{}',
  reported_ago_mins integer not null check (reported_ago_mins >= 0),
  match_score smallint not null check (match_score between 0 and 100),
  score_clinical_fit smallint not null check (score_clinical_fit between 0 and 40),
  score_travel_proximity smallint not null check (score_travel_proximity between 0 and 30),
  score_bed_capacity_ratio smallint not null check (score_bed_capacity_ratio between 0 and 20),
  score_specialty_match smallint not null check (score_specialty_match between 0 and 10),
  score_total smallint not null check (score_total between 0 and 100),
  recommendation_reason_en text not null,
  recommendation_reason_ur text not null,
  recommendation_reason_sd text not null,
  updated_at timestamptz not null default now()
);

create table public.referral_holds (
  id uuid primary key default gen_random_uuid(),
  pass_code text not null unique,
  patient_name text not null,
  condition text not null,
  hospital_id text not null references public.hospitals(id) on delete restrict,
  expires_at timestamptz not null,
  total_hold_seconds integer not null check (total_hold_seconds > 0),
  priority_triage text not null check (priority_triage in ('RED_CRITICAL', 'YELLOW_URGENT', 'GREEN_STANDARD')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index referral_holds_hospital_expires_at_idx on public.referral_holds (hospital_id, expires_at);
create index referral_holds_expires_at_idx on public.referral_holds (expires_at);

alter table public.hospitals enable row level security;
alter table public.referral_holds enable row level security;

create policy "Anyone can view hospitals" on public.hospitals for select to anon, authenticated using (true);
create policy "Anyone can view referral holds" on public.referral_holds for select to anon, authenticated using (true);

create policy "Coordinators can insert hospitals" on public.hospitals for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');
create policy "Coordinators can update hospitals" on public.hospitals for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');
create policy "Coordinators can delete hospitals" on public.hospitals for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');

create policy "Coordinators can insert referral holds" on public.referral_holds for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');
create policy "Coordinators can update referral holds" on public.referral_holds for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');
create policy "Coordinators can delete referral holds" on public.referral_holds for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'coordinator');

grant select on public.hospitals, public.referral_holds to anon, authenticated;
grant insert, update, delete on public.hospitals, public.referral_holds to authenticated;

alter publication supabase_realtime add table public.hospitals, public.referral_holds;
