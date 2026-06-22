# Telas Funcionais do App (estado atual)

Documento descrevendo **apenas as telas realmente acessíveis e operacionais** hoje no projeto. Cada item lista: rota, arquivo, quem acessa, o que faz e principais características.

> Critério de "funcional": a rota está registrada em `src/App.tsx`, renderiza sem erro, consulta dados reais (Supabase) e o usuário consegue executar a ação principal da tela.

---

## 1. Área Pública / Autenticação

### 1.1 Login & Cadastro
- **Rota:** `/auth` (e `/register?code=XXX` que redireciona para cá)
- **Arquivo:** `src/pages/Auth.tsx`
- **Acesso:** Anônimo
- **Função:** Login por e‑mail/senha, cadastro de novo lojista e aceite de convite (via `?code=`).
- **Características:**
  - Formulário único com toggle entre "Entrar" e "Criar conta"
  - Suporte a convites (`invites` table → vincula novo usuário ao admin que convidou)
  - Sem Google OAuth (ainda não configurado)
  - Sem fluxo de "Esqueci minha senha"

---

## 2. Experiência do Cliente (visitante da loja)

Layout compartilhado: `src/components/client/ClientLayout.tsx` + `ClientBottomNav` (4 abas: Vitrine, Buscar, Salvos, Loja).
Todas as rotas são públicas e aplicam as **cores de marca da loja** automaticamente.

### 2.1 Vitrine da Loja
- **Rotas:** `/loja/:lojaSlug/vitrine` (canônica) · `/p/:lojaSlug` (atalho) · `/loja/:lojaSlug` (redireciona para vitrine)
- **Arquivo:** `src/pages/client/ClientVitrine.tsx`
- **Função:** Home da loja — header com logo/nome do lojista + grid de veículos disponíveis.
- **Características:** Cards com foto, título, preço, badges de status. Esconde vendidos por padrão.

### 2.2 Buscar Veículos
- **Rota:** `/loja/:lojaSlug/buscar`
- **Arquivo:** `src/pages/client/ClientBuscar.tsx`
- **Função:** Filtros (marca, modelo, faixa de preço, ano) sobre o portfólio da loja.
- **Características:** Usa `PortfolioFilters` reaproveitado do Dashboard.

### 2.3 Salvos (Favoritos do visitante)
- **Rota:** `/loja/:lojaSlug/salvos`
- **Arquivo:** `src/pages/client/ClientSalvos.tsx`
- **Função:** Mostra os veículos favoritados pelo visitante (persistidos via `useFavorites`, escopo por device).
- **Características:** Heart toggle em cada card. Estado local — não exige login.

### 2.4 Sobre a Loja
- **Rota:** `/loja/:lojaSlug/sobre`
- **Arquivo:** `src/pages/client/ClientLoja.tsx`
- **Função:** Página institucional do lojista — bio, contato WhatsApp, localização (mapa Leaflet), prova social.
- **Características:** CTA WhatsApp (`wa.me`), mapa interativo se houver lat/long.

### 2.5 Página do Veículo (Landing Page)
- **Rotas:**
  - `/:lojaSlug/:veiculoSlug` — **URL canônica amigável**
  - `/v/:veiculoSlug` → redireciona para canônica (`ClientVehicleRedirect`)
  - `/veiculo/:id` e `/imovel/:id` — legados (ainda funcionais)
- **Arquivo:** `src/pages/ImovelPublic.tsx`
- **Função:** Landing page do carro: galeria, preço, descrição, vídeos YouTube embedados, formulário de captura de lead, CTA WhatsApp.
- **Características:**
  - SEO via `react-helmet-async` (`SeoTags`)
  - Contador `view_count` incrementa por visita
  - `LeadCaptureForm` grava em `leads` (envio de e‑mail ainda não funciona — edge function só faz `console.log`)
  - Botão de compartilhar com Web Share API + fallback

---

## 3. Área do Lojista (logado, role `corretor` ou `admin`)

Layout: `src/components/AppLayout.tsx` + `BottomNav` (Dashboard, Atividade, +, Leads, Perfil).

### 3.1 Dashboard / Minha Vitrine
- **Rota:** `/`
- **Arquivo:** `src/pages/Dashboard.tsx`
- **Função:** Lista de veículos do lojista. CRUD completo (criar, editar, excluir, marcar vendido), gerar link rastreável (edge function `generate-share-link`), filtros.
- **Características:** Botão "+" da BottomNav dispara o form (`PropertyForm`). Logout no header. Atalho para `/admin` se for admin.

### 3.2 Atividade
- **Rota:** `/atividade`
- **Arquivo:** `src/pages/Atividade.tsx`
- **Função:** Feed de eventos da conta — novos leads, cliques em WhatsApp, visitas à landing page.
- **Características:** Lê da tabela `activity_feed`. **Sem** marcar como lido.

### 3.3 Leads
- **Rota:** `/leads`
- **Arquivo:** `src/pages/Leads.tsx`
- **Função:** Lista de leads capturados nas landing pages — nome, telefone, veículo de interesse, data.
- **Características:** Apenas listagem. Não há pipeline/estágios nem marcação de status.

### 3.4 Salvos (Lojista)
- **Rota:** `/salvos`
- **Arquivo:** `src/pages/Salvos.tsx`
- **Função:** Veículos que o próprio lojista marcou como favoritos.
- **Características:** Mesmo `useFavorites` da experiência cliente.

### 3.5 Perfil
- **Rota:** `/perfil`
- **Arquivo:** `src/pages/Perfil.tsx`
- **Função:** Editar dados da loja — nome, foto/logo, bio, WhatsApp, endereço, **cores da marca** (primária e accent), slug público.
- **Características:** Upload de imagem (bucket `properties`/`property-images`). `BrandColorsSection` aplica preview ao vivo.

### 3.6 Métricas
- **Rota:** `/metricas`
- **Arquivo:** `src/pages/Metricas.tsx`
- **Função:** Dashboard de visualizações por veículo, cliques em WhatsApp, leads gerados.
- **Características:** Usa `view_count_today` / `whatsapp_clicks_today` — **mas não há reset diário automático**, então os contadores "do dia" acumulam para sempre.

### 3.7 Minha Rede
- **Rota:** `/rede`
- **Arquivo:** `src/pages/MinhaRede.tsx`
- **Função:** Lista dos lojistas vinculados ao admin atual (relação `parent_id`).
- **Características:** Visualização apenas. Apropriado para multi‑loja.

### 3.8 Conhecimento (hub)
- **Rota:** `/conhecimento`
- **Arquivo:** `src/pages/Conhecimento.tsx`
- **Função:** Hub com 2 abas — **Artigos Técnicos** + **Aulas**. Substitui os antigos `/capacitacao` e `/ead`.
- **Características:** Tab persistida em query string (`?tab=aulas`). Conteúdo vem de `learning_content` filtrado por audience.

### 3.9 Vídeos
- **Rota:** `/videos`
- **Arquivo:** `src/pages/Videos.tsx`
- **Função:** Biblioteca pessoal de vídeos YouTube do lojista — para vincular aos veículos.
- **Características:** CRUD simples, valida URL via `lib/youtube.ts`.

### 3.10 Capacitação e EAD (legadas, ainda acessíveis)
- **Rotas:** `/capacitacao`, `/ead`
- **Arquivos:** `src/pages/Capacitacao.tsx`, `src/pages/EAD.tsx`
- **Função:** Versões antigas das abas que hoje vivem dentro de `/conhecimento`.
- **Status:** **Funcionam**, mas estão **fora do menu** — só quem souber a URL acessa. Candidatas a remoção.

---

## 4. Área Administrativa (role `admin`)

Layout: `src/components/AdminLayout.tsx`. Protegida por `ProtectedRoute requireAdmin`.

### 4.1 Admin Dashboard
- **Rota:** `/admin`
- **Arquivo:** `src/pages/admin/AdminDashboard.tsx`
- **Função:** Visão geral — contagem de lojistas, veículos, leads.

### 4.2 Lojistas
- **Rota:** `/admin/lojistas`
- **Arquivo:** `src/pages/admin/AdminCorretores.tsx`
- **Função:** Listar todos os lojistas, alterar role, ativar/desativar.

### 4.3 Convites
- **Rota:** `/admin/convites`
- **Arquivo:** `src/pages/admin/AdminConvites.tsx`
- **Função:** Gerar códigos de convite que viram link `/register?code=XXX`.

### 4.4 Leads (admin)
- **Rota:** `/admin/leads`
- **Arquivo:** `src/pages/admin/AdminLeads.tsx`
- **Função:** Ver todos os leads da plataforma, agrupados por lojista.

### 4.5 Aulas (admin)
- **Rota:** `/admin/aulas`
- **Arquivo:** `src/pages/admin/AdminAulas.tsx`
- **Função:** CRUD de aulas/conteúdo de capacitação.

### 4.6 Conhecimento (admin)
- **Rota:** `/admin/conhecimento`
- **Arquivo:** `src/pages/admin/AdminConhecimento.tsx`
- **Função:** CRUD de artigos técnicos publicados em `/conhecimento`.

---

## 5. Utilitárias

### 5.1 404
- **Rota:** `*`
- **Arquivo:** `src/pages/NotFound.tsx`
- **Função:** Página de "não encontrado" para qualquer rota inválida.

---

## Resumo numérico

| Área | Telas funcionais |
|---|---|
| Pública / Auth | 1 |
| Cliente (visitante) | 5 |
| Lojista | 10 (8 no menu + 2 legadas acessíveis por URL) |
| Admin | 6 |
| Utilitárias | 1 |
| **Total** | **23 telas** |

## Observações importantes

- **Sem menu mas funcionais:** `/capacitacao`, `/ead`, `/videos` (Vídeos não tem item na BottomNav atual).
- **Funcionam parcialmente:**
  - `ImovelPublic` captura o lead, mas a notificação por e‑mail não é enviada (edge function incompleta).
  - `Métricas` mostra contadores "do dia" que nunca zeram.
- **Não listadas aqui** (existem como arquivos mas não estão roteadas / não funcionam de verdade): `PublicPortfolio.tsx`, componentes órfãos como `PublicBottomNav`, `ClientHeader`.
