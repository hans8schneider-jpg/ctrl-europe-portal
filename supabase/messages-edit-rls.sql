-- Spusť v Supabase → SQL Editor
-- Sloupec updated_at + RLS pro úpravu vlastní zprávy do 10 minut od odeslání.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authors can update own recent messages" ON public.messages;

CREATE POLICY "Authors can update own recent messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    AND created_at > (now() - interval '10 minutes')
  )
  WITH CHECK (
    auth.uid() = author_id
  );
