BEGIN;
CREATE FUNCTION public.guard_profile_access_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Profile access fields require administrator privileges'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_profile_access_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW WHEN (
  OLD.role IS DISTINCT FROM NEW.role OR
  OLD.is_admin IS DISTINCT FROM NEW.is_admin
)
EXECUTE FUNCTION public.guard_profile_access_fields();
COMMIT;
