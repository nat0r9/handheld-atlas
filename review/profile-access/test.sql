-- Disposable PostgreSQL database only. No external connection or credentials.
CREATE ROLE authenticated;
CREATE TABLE public.profiles (id int primary key, display_name text, role text, is_admin boolean);
INSERT INTO public.profiles VALUES (1,'Member','user',false),(2,'Admin','admin',true);
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS int LANGUAGE sql STABLE AS
$$ SELECT current_setting('test.actor')::int $$;
GRANT USAGE ON SCHEMA auth TO authenticated;
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_admin=true) $$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT,UPDATE ON public.profiles TO authenticated;
CREATE POLICY visible ON public.profiles FOR SELECT USING (true);
CREATE POLICY own_row ON public.profiles FOR UPDATE USING (id=auth.uid()) WITH CHECK (id=auth.uid());
CREATE POLICY admin_rows ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
\ir guard-profile-access.sql
SET ROLE authenticated;
SET test.actor='1';
UPDATE public.profiles SET display_name='Edited' WHERE id=1;
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM public.profiles WHERE id=1 AND display_name='Edited') THEN
    RAISE EXCEPTION 'Ordinary edit failed';
  END IF;
  BEGIN
    UPDATE public.profiles SET role='fixture-role' WHERE id=1;
    RAISE EXCEPTION 'Expected role guard';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.profiles SET is_admin=NULL WHERE id=1;
    RAISE EXCEPTION 'Expected flag guard';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
SET test.actor='2';
UPDATE public.profiles SET role='fixture-role' WHERE id=1;
DO $$ BEGIN
 IF NOT EXISTS (SELECT FROM public.profiles WHERE id=1 AND role='fixture-role' AND is_admin=false) THEN
   RAISE EXCEPTION 'Admin edit failed';
 END IF;
END $$;
