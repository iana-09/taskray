-- Admin-only account management RPCs. These functions enforce authorization server-side.
create or replace function public.admin_update_user(
  target_user_id uuid,
  new_name text,
  new_username text,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if new_role not in ('user', 'admin') then
    raise exception 'Invalid role';
  end if;

  if target_user_id = auth.uid() and new_role <> 'admin' then
    raise exception 'You cannot remove your own admin role';
  end if;

  update public.profiles
  set name = nullif(trim(new_name), ''),
      username = lower(trim(new_username)),
      role = new_role
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account';
  end if;

  select role into target_role from public.profiles where id = target_user_id;
  if target_role is null then
    raise exception 'User not found';
  end if;

  if target_role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'The last administrator cannot be deleted';
  end if;

  delete from public.tasks where user_id = target_user_id;
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text) from public;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_update_user(uuid, text, text, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
