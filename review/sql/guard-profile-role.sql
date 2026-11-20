-- Review and test in staging before applying. Runs with caller privileges.
BEGIN;
CREATE OR REPLACE FUNCTION public.guard_profile_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_user IN ('anon', 'authenticated')
     AND NOT coalesce(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Only administrators can change a profile role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.guard_profile_role_change();
COMMIT;
