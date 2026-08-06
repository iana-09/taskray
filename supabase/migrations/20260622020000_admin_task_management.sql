-- Admin-only task moderation functions.
create or replace function public.admin_update_task_status(target_task_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  if new_status not in ('todo', 'in-progress', 'completed') then
    raise exception 'Invalid task status';
  end if;
  update public.tasks set status = new_status where id = target_task_id;
  if not found then raise exception 'Task not found'; end if;
end;
$$;

create or replace function public.admin_delete_task(target_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;
  delete from public.tasks where id = target_task_id;
  if not found then raise exception 'Task not found'; end if;
end;
$$;

revoke all on function public.admin_update_task_status(uuid, text) from public;
revoke all on function public.admin_delete_task(uuid) from public;
grant execute on function public.admin_update_task_status(uuid, text) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
