-- Enforce case-insensitive uniqueness even when two requests arrive together.
create unique index if not exists profiles_username_unique_ci
  on public.profiles (lower(username));

create unique index if not exists profiles_email_unique_ci
  on public.profiles (lower(email));

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_valid'
  ) then
    alter table public.profiles
      add constraint profiles_role_valid check (role in ('user', 'admin'));
  end if;
end $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
    and not public.is_admin()
  then
    raise exception 'Only administrators can change user roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all tasks" on public.tasks;
create policy "Admins can view all tasks"
on public.tasks for select
to authenticated
using (public.is_admin());
