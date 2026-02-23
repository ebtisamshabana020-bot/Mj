-- Fix: infinite recursion detected in policy for relation "profiles"
-- Cause: policy on profiles querying profiles directly in USING/WITH CHECK.
-- Run in Supabase SQL Editor.

begin;

-- Remove recursive policy if it exists.
drop policy if exists profiles_admin_all on public.profiles;

-- Optional: helper function that checks admin role without triggering RLS recursion.
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- Recreate safe admin policy using helper function.
create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

commit;
