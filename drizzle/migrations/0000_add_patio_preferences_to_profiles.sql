ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS patio_map_id text DEFAULT 'carro-certo',
  ADD COLUMN IF NOT EXISTS patio_enabled boolean NOT NULL DEFAULT true;