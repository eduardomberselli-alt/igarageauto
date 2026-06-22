CREATE OR REPLACE FUNCTION public.get_invite_quota(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prop_count INT;
  cert_count INT;
  total INT;
BEGIN
  -- Admin tem convites ilimitados
  IF public.has_role(_user_id, 'admin') THEN
    RETURN 9999;
  END IF;

  SELECT COUNT(*) INTO prop_count FROM public.properties WHERE owner_id = _user_id;
  SELECT COUNT(*) INTO cert_count FROM public.certifications WHERE owner_id = _user_id;
  total := COALESCE(prop_count,0) + COALESCE(cert_count,0);
  IF total >= 10 THEN RETURN 10; END IF;
  IF total >= 5  THEN RETURN 5;  END IF;
  RETURN 3;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_invites_remaining(_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  quota INT;
  used INT;
BEGIN
  quota := public.get_invite_quota(_user_id);
  SELECT COUNT(*) INTO used
    FROM public.invites
    WHERE inviter_id = _user_id
      AND status IN ('pending','accepted');
  RETURN GREATEST(quota - used, 0);
END;
$function$;