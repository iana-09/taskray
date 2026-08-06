create table if not exists public.essay_practice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled essay',
  topic text not null default '',
  description text,
  category text not null default 'Education',
  difficulty text not null default 'Medium',
  essay_type text not null default 'Argumentative',
  content text not null default '',
  feedback jsonb,
  scores jsonb,
  word_count integer not null default 0,
  estimated_minutes integer,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.essay_practice enable row level security;

create policy "Users can view their own essays"
  on public.essay_practice
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own essays"
  on public.essay_practice
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own essays"
  on public.essay_practice
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own essays"
  on public.essay_practice
  for delete
  using (auth.uid() = user_id);

create index if not exists essay_practice_user_updated_idx
  on public.essay_practice (user_id, updated_at desc);
