-- ====== 1) Limite de 5 vídeos por imóvel ======
CREATE OR REPLACE FUNCTION public.enforce_video_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.videos WHERE property_id = NEW.property_id;
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Limite de 5 vídeos por imóvel atingido' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_video_limit ON public.videos;
CREATE TRIGGER trg_enforce_video_limit
BEFORE INSERT ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.enforce_video_limit();

-- ====== 2) Transferência de imóveis ao remover corretor ======
CREATE OR REPLACE FUNCTION public.transfer_corretor_to_admin(_corretor_id uuid, _new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas admins podem chamar
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem transferir imóveis';
  END IF;
  -- O destino também deve ser admin
  IF NOT public.has_role(_new_owner_id, 'admin') THEN
    RAISE EXCEPTION 'O novo dono deve ser um administrador';
  END IF;

  UPDATE public.properties SET owner_id = _new_owner_id WHERE owner_id = _corretor_id;
  UPDATE public.leads      SET owner_id = _new_owner_id WHERE owner_id = _corretor_id;
  UPDATE public.certifications SET owner_id = _new_owner_id WHERE owner_id = _corretor_id;
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_corretor_to_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_corretor_to_admin(uuid, uuid) TO authenticated;