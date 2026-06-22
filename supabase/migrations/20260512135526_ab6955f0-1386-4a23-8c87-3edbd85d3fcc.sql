CREATE TABLE public.share_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lojista_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL,
  accessed_at TIMESTAMPTZ,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_tracking_lojista ON public.share_tracking(lojista_id);
CREATE INDEX idx_share_tracking_vehicle ON public.share_tracking(vehicle_id);
CREATE INDEX idx_share_tracking_code ON public.share_tracking(tracking_code);
CREATE INDEX idx_share_tracking_accessed ON public.share_tracking(accessed_at);

ALTER TABLE public.share_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lojistas veem seus dados"
  ON public.share_tracking FOR SELECT
  USING (lojista_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lojistas criam seus rastreios"
  ON public.share_tracking FOR INSERT
  WITH CHECK (lojista_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Edge function/anon atualiza acesso"
  ON public.share_tracking FOR UPDATE
  USING (true)
  WITH CHECK (true);