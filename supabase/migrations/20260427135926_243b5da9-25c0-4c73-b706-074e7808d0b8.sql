-- Adiciona coluna de contato na tabela leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contacted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

-- Permitir UPDATE pelo dono do lead ou admin (para marcar contato)
DROP POLICY IF EXISTS leads_update_owner_or_admin ON public.leads;
CREATE POLICY leads_update_owner_or_admin
ON public.leads
FOR UPDATE
USING ((auth.uid() = owner_id) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = owner_id) OR has_role(auth.uid(), 'admin'::app_role));