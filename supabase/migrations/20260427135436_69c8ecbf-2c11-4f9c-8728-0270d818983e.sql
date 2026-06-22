ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT;

-- property_id passa a ser opcional (lead pode ser geral, não vinculado a imóvel)
ALTER TABLE public.leads ALTER COLUMN property_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_property ON public.leads(property_id);