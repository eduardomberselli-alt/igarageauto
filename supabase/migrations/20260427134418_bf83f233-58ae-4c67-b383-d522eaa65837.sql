-- ============================================================
-- CÍRCULO LEGACY — Sistema de convites + árvore de rede
-- ============================================================

-- Status do convite
DO $$ BEGIN
  CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- TABELA: invites
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT,
  invitee_user_id UUID,
  status public.invite_status NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_inviter ON public.invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON public.invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select_owner_or_admin"
  ON public.invites FOR SELECT
  USING (auth.uid() = inviter_id OR public.has_role(auth.uid(), 'admin'));

-- Permite validar um código no fluxo público de signup (lookup por code)
CREATE POLICY "invites_select_by_code_anon"
  ON public.invites FOR SELECT
  TO anon
  USING (status = 'pending');

CREATE POLICY "invites_insert_owner"
  ON public.invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "invites_update_owner_or_admin"
  ON public.invites FOR UPDATE
  USING (auth.uid() = inviter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "invites_delete_owner_or_admin"
  ON public.invites FOR DELETE
  USING (auth.uid() = inviter_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER invites_updated_at
  BEFORE UPDATE ON public.invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABELA: network_relationships
-- ============================================================
CREATE TABLE IF NOT EXISTS public.network_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID NOT NULL,
  invited_id UUID NOT NULL UNIQUE,
  invite_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_network_sponsor ON public.network_relationships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_network_invited ON public.network_relationships(invited_id);

ALTER TABLE public.network_relationships ENABLE ROW LEVEL SECURITY;

-- Toda a rede é visível a usuários autenticados (para mostrar árvore)
CREATE POLICY "network_select_authenticated"
  ON public.network_relationships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "network_admin_all"
  ON public.network_relationships FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FUNÇÃO: cota de convites com base no selo de autoridade
-- Bronze: 3 | Prata: 5 | Ouro: 10
-- Selo é calculado por: nº de propriedades + nº de certificações
--   >= 10 itens => Ouro
--   >= 5 itens  => Prata
--   senão       => Bronze
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_invite_quota(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_count INT;
  cert_count INT;
  total INT;
BEGIN
  SELECT COUNT(*) INTO prop_count FROM public.properties WHERE owner_id = _user_id;
  SELECT COUNT(*) INTO cert_count FROM public.certifications WHERE owner_id = _user_id;
  total := COALESCE(prop_count,0) + COALESCE(cert_count,0);
  IF total >= 10 THEN RETURN 10; END IF;
  IF total >= 5  THEN RETURN 5;  END IF;
  RETURN 3;
END;
$$;

-- ============================================================
-- FUNÇÃO: convites restantes (cota - usados/pendentes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_invites_remaining(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- ============================================================
-- FUNÇÃO: aceitar convite (chamada após o usuário se cadastrar)
-- ============================================================
CREATE OR REPLACE FUNCTION public.accept_invite(_code TEXT, _new_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.invites WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;
  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Convite já utilizado ou revogado';
  END IF;
  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    UPDATE public.invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  UPDATE public.invites
    SET status = 'accepted',
        invitee_user_id = _new_user_id,
        accepted_at = now()
    WHERE id = v_invite.id;

  INSERT INTO public.network_relationships (sponsor_id, invited_id, invite_id)
    VALUES (v_invite.inviter_id, _new_user_id, v_invite.id)
    ON CONFLICT (invited_id) DO NOTHING;

  RETURN v_invite.id;
END;
$$;

-- ============================================================
-- TRIGGER ATUALIZADO: handle_new_user agora processa invite_code
-- O primeiro usuário (sem nenhum admin ainda) entra como admin sem convite.
-- Demais usuários DEVEM trazer raw_user_meta_data->>'invite_code' válido.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_admin BOOLEAN;
  v_code TEXT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_admin;

  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email, 'Corretor'));

  IF NOT has_admin THEN
    -- Primeiro usuário do sistema vira admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    v_code := NEW.raw_user_meta_data->>'invite_code';
    IF v_code IS NULL OR length(v_code) = 0 THEN
      RAISE EXCEPTION 'Cadastro restrito: código de convite obrigatório';
    END IF;
    PERFORM public.accept_invite(v_code, NEW.id);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'corretor');
  END IF;

  RETURN NEW;
END;
$$;

-- Garante que o trigger esteja ligado (caso ainda não exista)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();