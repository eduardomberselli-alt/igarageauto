
CREATE TABLE public.opcionais_disponiveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.opcionais_disponiveis TO authenticated;
GRANT SELECT ON public.opcionais_disponiveis TO anon;
GRANT ALL ON public.opcionais_disponiveis TO service_role;

ALTER TABLE public.opcionais_disponiveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view opcionais"
  ON public.opcionais_disponiveis FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add opcionais"
  ON public.opcionais_disponiveis FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update opcionais"
  ON public.opcionais_disponiveis FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete opcionais"
  ON public.opcionais_disponiveis FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_opcionais_disponiveis_updated_at
  BEFORE UPDATE ON public.opcionais_disponiveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.opcionais_disponiveis (nome) VALUES
  ('Airbag'),
  ('Alarme'),
  ('Ar Condicionado'),
  ('Bancos de Couro'),
  ('Blindado'),
  ('Central Multimídia (Apple CarPlay/Android Auto)'),
  ('Câmera de Ré / Sensor'),
  ('Chave Presencial (Start-Stop)'),
  ('Desembaçador Traseiro'),
  ('Direção Hidráulica/Elétrica'),
  ('Faróis de LED'),
  ('Freios ABS'),
  ('Piloto Automático'),
  ('Teto Solar'),
  ('Travas Elétricas'),
  ('Tração 4x4'),
  ('Turbo'),
  ('Vidros Elétricos'),
  ('Volante Multifuncional')
ON CONFLICT (nome) DO NOTHING;
