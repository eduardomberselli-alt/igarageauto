ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS url_card_whatsapp text,
  ADD COLUMN IF NOT EXISTS card_signature text;