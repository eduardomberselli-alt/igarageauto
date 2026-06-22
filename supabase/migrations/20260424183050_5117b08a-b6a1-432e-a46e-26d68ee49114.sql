DROP POLICY IF EXISTS "learning_select_authenticated" ON public.learning_content;

CREATE POLICY "learning_select_authenticated"
  ON public.learning_content FOR SELECT
  TO authenticated
  USING (true);