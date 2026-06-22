-- 1) Add photo array column to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS fotos_urls text[] NOT NULL DEFAULT '{}'::text[];

-- 2) Create public storage bucket for property photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for the 'properties' bucket
DROP POLICY IF EXISTS "Property photos are publicly accessible" ON storage.objects;
CREATE POLICY "Property photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'properties');

DROP POLICY IF EXISTS "Brokers can upload property photos to own folder" ON storage.objects;
CREATE POLICY "Brokers can upload property photos to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'properties'
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Brokers can update own property photos" ON storage.objects;
CREATE POLICY "Brokers can update own property photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'properties'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Brokers can delete own property photos" ON storage.objects;
CREATE POLICY "Brokers can delete own property photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'properties'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);