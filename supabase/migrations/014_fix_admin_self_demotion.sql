-- prevent_profile_privilege_escalation previously let an admin change ANY
-- field on their own profile row unconditionally (the `is_admin` check didn't
-- distinguish self-updates from an admin managing someone else's account).
-- Combined with auth-context.tsx's metadata-role sync (which re-applies the
-- role picked at original signup on every login), this silently demoted the
-- one admin account back to "student" on login, since the trigger's own
-- permissive self-service rule let the change through. Fixed in the app code
-- (auth-context.tsx now skips the sync entirely for admins) and here, as a
-- second layer: self-updates are now restricted to the original one-time
-- onboarding transition regardless of admin status; only admins acting on
-- SOMEONE ELSE's row (the real admin-panel user-management feature) keep the
-- unrestricted bypass.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  is_admin boolean;
  is_self boolean;
begin
  if new.role is not distinct from old.role and new.status is not distinct from old.status then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  is_self := (old.user_id = auth.uid());

  select exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'admin'
  ) into is_admin;

  if is_admin and not is_self then
    return new;
  end if;

  if old.role = 'student' and old.status = 'active'
     and new.role in ('student', 'rider')
     and new.status in ('active', 'pending') then
    return new;
  end if;

  raise exception 'Only an admin can change role or status after initial signup';
end;
$function$
