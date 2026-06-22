-- Adiciona coluna slug em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug text;

-- Preenche slugs existentes baseado no nome (ou parte do user_id se nome vazio)
UPDATE public.profiles
SET slug = lower(
  regexp_replace(
    regexp_replace(
      COALESCE(NULLIF(trim(nome), ''), 'corretor-' || substr(user_id::text, 1, 8)),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || substr(user_id::text, 1, 4)
WHERE slug IS NULL;

-- Garante unicidade
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_unique ON public.profiles (slug) WHERE slug IS NOT NULL;