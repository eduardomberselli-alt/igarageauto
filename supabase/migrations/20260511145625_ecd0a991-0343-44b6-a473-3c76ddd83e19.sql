-- Tabela de favoritos
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  vehicle_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX favorites_user_vehicle_uniq
  ON public.favorites (user_id, vehicle_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX favorites_session_vehicle_uniq
  ON public.favorites (session_id, vehicle_id)
  WHERE session_id IS NOT NULL AND user_id IS NULL;

CREATE INDEX favorites_user_idx ON public.favorites (user_id, created_at DESC);
CREATE INDEX favorites_session_idx ON public.favorites (session_id, created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- SELECT: dono (user) ou sessão anônima ou admin
CREATE POLICY favorites_select_own
  ON public.favorites FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id IS NOT NULL)
    OR public.has_role(auth.uid(), 'admin')
  );

-- INSERT: usuário logado salva com seu id; anônimo salva com session_id e user_id NULL
CREATE POLICY favorites_insert_own
  ON public.favorites FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id AND session_id IS NULL)
    OR (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
    OR public.has_role(auth.uid(), 'admin')
  );

-- DELETE: dono ou anônimo da mesma sessão
CREATE POLICY favorites_delete_own
  ON public.favorites FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND session_id IS NOT NULL)
    OR public.has_role(auth.uid(), 'admin')
  );