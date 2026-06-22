-- Limpar dados dependentes primeiro (sem FKs formais, mas por segurança lógica)
DELETE FROM public.capacitacao_progress;
DELETE FROM public.network_relationships;
DELETE FROM public.invites;
DELETE FROM public.leads;
DELETE FROM public.videos;
DELETE FROM public.certifications;
DELETE FROM public.properties;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- Remover todos os usuários do auth (cascata limpa sessões/identidades)
DELETE FROM auth.users;