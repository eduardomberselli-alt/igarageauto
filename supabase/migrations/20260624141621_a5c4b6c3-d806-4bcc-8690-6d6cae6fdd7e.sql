ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS frase_chamada TEXT;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Reaproveita as políticas existentes; apenas garante que a tabela tenha RLS ativo.