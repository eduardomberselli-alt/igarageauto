-- 1) Função utilitária: texto -> slug
CREATE OR REPLACE FUNCTION public.slugify(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(
    both '-' from
    regexp_replace(
      lower(
        translate(
          coalesce(t, ''),
          'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
          'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  )
$$;

-- 2) Coluna slug
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug TEXT;

-- 3) Backfill — gera slug único dentro de cada owner_id
DO $$
DECLARE
  r RECORD;
  base TEXT;
  cand TEXT;
  n INT;
BEGIN
  FOR r IN SELECT id, owner_id, titulo, year FROM public.properties WHERE slug IS NULL OR slug = '' LOOP
    base := public.slugify(r.titulo || CASE WHEN r.year IS NOT NULL THEN '-' || r.year::text ELSE '' END);
    IF base = '' THEN base := substring(r.id::text, 1, 8); END IF;
    cand := base;
    n := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.properties
      WHERE owner_id = r.owner_id AND slug = cand AND id <> r.id
    ) LOOP
      n := n + 1;
      cand := base || '-' || n::text;
    END LOOP;
    UPDATE public.properties SET slug = cand WHERE id = r.id;
  END LOOP;
END$$;

-- 4) Índice único (owner_id, slug)
CREATE UNIQUE INDEX IF NOT EXISTS properties_owner_slug_uniq
  ON public.properties (owner_id, slug)
  WHERE slug IS NOT NULL;

-- 5) Trigger: gera slug ao inserir/atualizar quando vazio
CREATE OR REPLACE FUNCTION public.set_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base TEXT;
  cand TEXT;
  n INT := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := public.slugify(NEW.titulo || CASE WHEN NEW.year IS NOT NULL THEN '-' || NEW.year::text ELSE '' END);
    IF base = '' THEN base := substring(NEW.id::text, 1, 8); END IF;
    cand := base;
    WHILE EXISTS (
      SELECT 1 FROM public.properties
      WHERE owner_id = NEW.owner_id AND slug = cand AND id <> NEW.id
    ) LOOP
      n := n + 1;
      cand := base || '-' || n::text;
    END LOOP;
    NEW.slug := cand;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_set_slug ON public.properties;
CREATE TRIGGER properties_set_slug
BEFORE INSERT OR UPDATE OF titulo, year, slug ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.set_property_slug();