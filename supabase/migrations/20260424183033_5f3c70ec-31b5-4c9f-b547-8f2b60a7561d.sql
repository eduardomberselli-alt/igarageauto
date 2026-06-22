-- Enum de categorias
CREATE TYPE public.learning_category AS ENUM (
  'engenharia_civil',
  'juridico_contratos',
  'documentacao',
  'tecnica_vendas'
);

-- Enum de audiência
CREATE TYPE public.learning_audience AS ENUM (
  'publico',
  'corretor'
);

-- Tabela
CREATE TABLE public.learning_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria public.learning_category NOT NULL,
  audiencia public.learning_audience NOT NULL DEFAULT 'publico',
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  youtube_id TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_content ENABLE ROW LEVEL SECURITY;

-- Público pode ver conteúdo "publico"
CREATE POLICY "learning_select_public"
  ON public.learning_content FOR SELECT
  USING (audiencia = 'publico');

-- Autenticados (corretores) podem ver tudo
CREATE POLICY "learning_select_authenticated"
  ON public.learning_content FOR SELECT
  TO authenticated
  USING (true);

-- Admin gerencia tudo
CREATE POLICY "learning_admin_all"
  ON public.learning_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_learning_content_updated_at
  BEFORE UPDATE ON public.learning_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_learning_categoria ON public.learning_content(categoria, ordem);