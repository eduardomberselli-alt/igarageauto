DROP POLICY IF EXISTS "Authenticated users can add opcionais" ON public.opcionais_disponiveis;
CREATE POLICY "Authenticated users can add opcionais"
  ON public.opcionais_disponiveis
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "network_select_authenticated" ON public.network_relationships;
CREATE POLICY "network_select_authenticated"
  ON public.network_relationships
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sponsor_id OR auth.uid() = invited_id);

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  TO public
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "leads_insert_anyone" ON public.leads;
CREATE POLICY "leads_insert_anyone"
  ON public.leads
  FOR INSERT
  TO public
  WITH CHECK (
    char_length(name) <= 100
    AND char_length(phone) <= 20
    AND char_length(COALESCE(email, '')) <= 255
    AND char_length(COALESCE(message, '')) <= 500
    AND (
      (
        property_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.properties AS vehicle
          WHERE vehicle.id = leads.property_id
            AND vehicle.owner_id = leads.owner_id
        )
      )
      OR
      (
        property_id IS NULL
        AND char_length(btrim(name)) >= 2
        AND char_length(btrim(phone)) >= 8
        AND EXISTS (
          SELECT 1
          FROM public.profiles AS store
          WHERE store.user_id = leads.owner_id
            AND store.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "certifications_select_all" ON public.certifications;
CREATE POLICY "certifications_select_all"
  ON public.certifications
  FOR SELECT
  TO public
  USING (
    auth.uid() = owner_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS store
      WHERE store.user_id = certifications.owner_id
        AND store.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Edge function/anon atualiza acesso" ON public.share_tracking;