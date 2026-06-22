-- 1. Novas colunas em properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS view_count_today INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_clicks_today INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Tabela de feed de atividade
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('hot_vehicle', 'price_drop', 'sold', 'many_views')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_owner_created
  ON public.activity_feed (owner_id, created_at DESC);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_select_owner_or_admin ON public.activity_feed;
CREATE POLICY activity_select_owner_or_admin
  ON public.activity_feed
  FOR SELECT
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS activity_insert_system ON public.activity_feed;
CREATE POLICY activity_insert_system
  ON public.activity_feed
  FOR INSERT
  WITH CHECK ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS activity_update_owner ON public.activity_feed;
CREATE POLICY activity_update_owner
  ON public.activity_feed
  FOR UPDATE
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS activity_delete_owner ON public.activity_feed;
CREATE POLICY activity_delete_owner
  ON public.activity_feed
  FOR DELETE
  USING ((auth.uid() = owner_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Trigger de redução de preço (coluna preco, dono = owner_id)
CREATE OR REPLACE FUNCTION public.detect_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.preco IS DISTINCT FROM NEW.preco AND NEW.preco < OLD.preco THEN
    INSERT INTO public.activity_feed (owner_id, vehicle_id, tipo, metadata)
    VALUES (
      NEW.owner_id,
      NEW.id,
      'price_drop',
      jsonb_build_object('old_price', OLD.preco, 'new_price', NEW.preco, 'titulo', NEW.titulo)
    );
    NEW.last_price := OLD.preco;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS price_drop_trigger ON public.properties;
CREATE TRIGGER price_drop_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_price_drop();

-- 4. Trigger para registrar 'sold' quando o veículo for marcado como vendido
CREATE OR REPLACE FUNCTION public.detect_sold()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.vendido IS DISTINCT FROM NEW.vendido AND NEW.vendido = true THEN
    INSERT INTO public.activity_feed (owner_id, vehicle_id, tipo, metadata)
    VALUES (
      NEW.owner_id,
      NEW.id,
      'sold',
      jsonb_build_object('titulo', NEW.titulo, 'preco', NEW.preco)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sold_trigger ON public.properties;
CREATE TRIGGER sold_trigger
  AFTER UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_sold();