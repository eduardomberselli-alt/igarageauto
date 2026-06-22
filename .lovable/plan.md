## Reestruturação da Área Administrativa — Admin como Super Lojista

Transformar o admin em um lojista completo com poderes adicionais para criar/gerenciar outras lojas. Convites ficam ocultos (sem remoção de tabelas/funções).

---

### 1. Ocultar Convites
- `src/components/AdminLayout.tsx`: remover aba "Convites" do `adminTabs`.
- `src/pages/Perfil.tsx`: remover botão/link "Convites" exibido para admin (substituído por "Nova Loja" — item 2).
- Manter `src/pages/admin/AdminConvites.tsx`, rota `/admin/convites`, tabela `invites` e RPCs intactos (apenas não navegáveis pela UI).

### 2. Botão "Nova Loja" no Perfil (admin)
- Em `src/pages/Perfil.tsx`, quando `isAdmin`, mostrar botão **Nova Loja** que navega para `/admin/lojas`.

### 3. Nova página `AdminLojas`
- Criar `src/pages/admin/AdminLojas.tsx`.
- Registrar rota `/admin/lojas` em `src/App.tsx` dentro de `AdminLayout`.
- Adicionar aba "Lojas" no `AdminLayout` (ícone `Store`).

### 4. Tela de Lojas (lista)
- Listar todos os profiles de lojistas + contagens (`properties`, `leads`) via queries paralelas.
- Cards com: logo (`foto_url`), nome (`nome_loja`/`nome`), proprietário (`nome`), nº veículos, nº leads, `created_at`, `status`.
- Botões por card: **Entrar na loja**, **Editar**, **Suspender/Reativar**, **Excluir** (confirmação via `AlertDialog`).

### 5. Criar Loja (modal/drawer)
- Botão **Nova Loja** no topo de `AdminLojas` abre `Dialog`.
- Form: nome da loja, slug, nome do proprietário, email, WhatsApp, senha provisória.
- Submit chama edge function `create-store`.

### 6. Edge Function `create-store`
- `supabase/functions/create-store/index.ts` com Service Role.
- Verifica que chamador é admin (valida JWT + `has_role`).
- `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`.
- Insere `profiles` (nome do dono, nome_loja/slug, whatsapp) e `user_roles` (`corretor`).
- Retorna `{ ok, user_id }`. Sessão do admin permanece intacta (não usa `signUp`).

### 7. Modo "Visualizando loja" (impersonation read-only via storeId)
- Criar `src/contexts/AdminViewContext.tsx` que mantém `viewingStoreId` (persistido em `sessionStorage`) e expõe `enterStore(id)` / `exitStore()`.
- Envolver `AppLayout` (admin) com o provider e mostrar banner sticky: "Visualizando loja: {nome}" + botão **Voltar para minha loja**.
- `useAppData` passa a aceitar um `ownerOverride` opcional; quando `viewingStoreId` está setado e o usuário é admin, hooks consultam `owner_id = viewingStoreId` para Dashboard, Métricas, Leads, Perfil, Vitrine.
- Edição é mantida ativa (admin pode tudo); telas exibem o banner para deixar claro o contexto.

### 8. Suspender loja
- Migration: `ALTER TABLE profiles ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended'))`.
- Botão **Suspender/Reativar** alterna o campo via `supabase.from('profiles').update({ status })`.
- Em `ProtectedRoute` (ou `useAuth`), se profile do usuário logado for `suspended` e não-admin → renderizar tela bloqueada: "Sua loja está temporariamente suspensa."

### 9. Excluir loja
- Edge function `supabase/functions/delete-store/index.ts` com Service Role.
- Valida que chamador é admin.
- Deleta em ordem: `favorites`, `videos` (via properties), `properties`, `leads`, `certifications`, `activity_feed`, `user_roles`, `profiles`, e por fim `auth.admin.deleteUser`.
- UI exige confirmação dupla (digitar nome da loja em `AlertDialog`).

### 10. Dashboard Admin
- Atualizar `src/pages/admin/AdminDashboard.tsx`:
  - Cards: Total de lojas (profiles), Lojas ativas (`status='active'`), Total de veículos, Total de leads, Veículos vendidos (`vendido=true`).
  - Remover/realocar card "Convites".

---

### Detalhes técnicos

**Migration (única):**
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','suspended'));
```

**Edge functions:** ambas com `verify_jwt = false` (padrão Lovable) mas validam JWT em código via `supabase.auth.getUser(token)` + `has_role(uid,'admin')`. CORS via `npm:@supabase/supabase-js@2/cors`. Validação de input com Zod.

**Arquivos novos:**
- `src/pages/admin/AdminLojas.tsx`
- `src/contexts/AdminViewContext.tsx`
- `src/components/AdminViewBanner.tsx`
- `supabase/functions/create-store/index.ts`
- `supabase/functions/delete-store/index.ts`

**Arquivos editados:**
- `src/App.tsx` (rota `/admin/lojas`, AdminViewProvider)
- `src/components/AdminLayout.tsx` (aba Lojas, remover Convites)
- `src/components/AppLayout.tsx` (banner de visualização)
- `src/pages/Perfil.tsx` (botão Nova Loja para admin)
- `src/pages/admin/AdminDashboard.tsx` (novos indicadores)
- `src/hooks/useAppData.ts` (suporte a `viewingStoreId`)
- `src/components/ProtectedRoute.tsx` (bloqueio de suspensos)
- `src/types/index.ts` (`status` em Profile)

---

### Confirmações antes de implementar
- Edição em "modo visualização": admin pode editar normalmente (apenas o banner indica o contexto). OK?
- Exclusão remove também `auth.users` (irreversível). OK?
- "Slug" do criar loja salva em `profiles.slug` (já existente). OK?
