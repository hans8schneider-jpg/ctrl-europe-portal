-- Přidá sloupec profile_id: unikátní 6místné alfanumerické ID uživatele (0–9, A–Z).
-- Spusť v Supabase → SQL Editor.

CREATE OR REPLACE FUNCTION public.generate_profile_id()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := '';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = candidate);
  END LOOP;
  RETURN candidate;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_id varchar(6);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE profile_id IS NULL LOOP
    UPDATE public.profiles
    SET profile_id = public.generate_profile_id()
    WHERE id = r.id;
  END LOOP;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN profile_id SET DEFAULT public.generate_profile_id(),
  ALTER COLUMN profile_id SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_id_unique;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_id_unique UNIQUE (profile_id);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_profile_id_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_profile_id_format CHECK (profile_id ~ '^[0-9A-Z]{6}$');

COMMENT ON COLUMN public.profiles.profile_id IS 'Veřejné 6místné ID uživatele pro akce v portálu';
