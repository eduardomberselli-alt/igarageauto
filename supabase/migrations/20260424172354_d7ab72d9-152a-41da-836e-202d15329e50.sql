
-- ===== ENUM de papéis =====
CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

-- ===== função timestamp =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  foto_url TEXT NOT NULL DEFAULT '',
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  whatsapp TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer para evitar recursão em RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== properties =====
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  bairro TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  foto_url TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  diferenciais TEXT[] NOT NULL DEFAULT '{}',
  quartos INT NOT NULL DEFAULT 0,
  vendido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== videos =====
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_videos_property ON public.videos(property_id);

-- ===== aulas =====
CREATE TABLE public.aulas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  youtube_id TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- ===== capacitacao_progress =====
CREATE TABLE public.capacitacao_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, aula_id)
);
ALTER TABLE public.capacitacao_progress ENABLE ROW LEVEL SECURITY;

-- ===== leads =====
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_leads_owner ON public.leads(owner_id);
CREATE INDEX idx_leads_property ON public.leads(property_id);

-- ============ POLICIES ============

-- profiles: público leitura (landing pages), só dono edita; admin tudo
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles: usuário vê os próprios; admin gerencia tudo
CREATE POLICY "roles_select_own_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- properties: público lê (landing pages); dono CRUD; admin tudo
CREATE POLICY "properties_select_all" ON public.properties FOR SELECT USING (true);
CREATE POLICY "properties_insert_owner" ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_update_owner_or_admin" ON public.properties FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "properties_delete_owner_or_admin" ON public.properties FOR DELETE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- videos: público lê; só dono do imóvel ou admin gerencia
CREATE POLICY "videos_select_all" ON public.videos FOR SELECT USING (true);
CREATE POLICY "videos_modify_owner_or_admin" ON public.videos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- aulas: público lê; só admin gerencia
CREATE POLICY "aulas_select_all" ON public.aulas FOR SELECT USING (true);
CREATE POLICY "aulas_admin_all" ON public.aulas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- capacitacao_progress: usuário vê e gerencia o próprio; admin tudo
CREATE POLICY "progress_select_own_or_admin" ON public.capacitacao_progress FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "progress_modify_own" ON public.capacitacao_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- leads: qualquer visitante registra (público); só dono e admin lêem
CREATE POLICY "leads_insert_anyone" ON public.leads FOR INSERT
  WITH CHECK (true);
CREATE POLICY "leads_select_owner_or_admin" ON public.leads FOR SELECT
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "leads_delete_owner_or_admin" ON public.leads FOR DELETE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGER: cria profile + role ao registrar usuário ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email, 'Corretor'));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'corretor');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Aulas iniciais ============
INSERT INTO public.aulas (titulo, descricao, youtube_id, ordem) VALUES
  ('Fundação: Tipos e aplicações', 'Entenda radier, sapata, estaca e tubulão — e quando cada um é indicado.', '5YwQK7ojwH4', 1),
  ('Documentação de Imóveis Rurais', 'CCIR, ITR, georreferenciamento, CAR e reserva legal.', '8jLOx1hD3_o', 2),
  ('Isolamento Térmico e Conforto', 'Materiais, normas NBR 15220 e impacto na valorização do imóvel.', 'Zi_XLOBDo_Y', 3);
