create table if not exists public.gwa_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  academic_year text not null,
  semester text not null,
  program text,
  year_level text,
  subjects jsonb not null default '[]'::jsonb,
  total_units numeric not null default 0,
  total_weighted_points numeric not null default 0,
  final_gwa numeric not null,
  calculation_method text not null check (calculation_method in ('weighted', 'unweighted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gwa_records enable row level security;

create policy "Users can read their own GWA records"
  on public.gwa_records for select
  using (auth.uid() = user_id);

create policy "Users can create their own GWA records"
  on public.gwa_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own GWA records"
  on public.gwa_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own GWA records"
  on public.gwa_records for delete
  using (auth.uid() = user_id);

create index if not exists gwa_records_user_created_idx
  on public.gwa_records(user_id, created_at desc);
