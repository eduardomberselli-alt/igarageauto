-- Garante criação automática do profile + role quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: cria profile para usuários que ficaram sem registro
INSERT INTO public.profiles (user_id, nome)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nome', u.email, 'Lojista')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- Backfill role para usuários sem role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  CASE WHEN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
       AND u.id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
       THEN 'admin'::app_role
       ELSE 'corretor'::app_role
  END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.id IS NULL;