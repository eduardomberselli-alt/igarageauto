import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthProvider } from "@/hooks/useAuth";
import { ClientLayout } from "@/components/client/ClientLayout";
import Dashboard from "./pages/Dashboard";
import Videos from "./pages/Videos";
import Capacitacao from "./pages/Capacitacao";
import EAD from "./pages/EAD";
import Conhecimento from "./pages/Conhecimento";
import AdminConhecimento from "./pages/admin/AdminConhecimento";
import Perfil from "./pages/Perfil";
import MinhaRede from "./pages/MinhaRede";
import Leads from "./pages/Leads";
import Salvos from "./pages/Salvos";
import Atividade from "./pages/Atividade";
import Metricas from "./pages/Metricas";
import ImovelPublic from "./pages/ImovelPublic";

import ClientVitrine from "./pages/client/ClientVitrine";
import ClientBuscar from "./pages/client/ClientBuscar";
import ClientSalvos from "./pages/client/ClientSalvos";
import ClientLoja from "./pages/client/ClientLoja";
import ClientVehicleRedirect from "./pages/client/ClientVehicleRedirect";
import ClientAcademy from "./pages/client/ClientAcademy";
import Auth from "./pages/Auth";
import AdminCorretores from "./pages/admin/AdminCorretores";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAulas from "./pages/admin/AdminAulas";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminConvites from "./pages/admin/AdminConvites";
import AdminLojas from "./pages/admin/AdminLojas";
import NotFound from "./pages/NotFound.tsx";
import { AdminViewProvider } from "@/contexts/AdminViewContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos — evita refetch ao trocar de aba
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

/** Redireciona /register?code=XXX -> /auth?code=XXX para o fluxo de convite. */
function RegisterRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/auth${search || ""}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <SplashScreen />
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Públicas */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<RegisterRedirect />} />
              {/* Experiência de cliente — bottom nav + contexto de loja */}
              <Route element={<ClientLayout />}>
                <Route path="/v/:veiculoSlug" element={<ClientVehicleRedirect />} />
                <Route path="/veiculo/:id" element={<ImovelPublic />} />
                <Route path="/imovel/:id" element={<ImovelPublic />} />
                <Route path="/p/:lojaSlug" element={<ClientVitrine />} />
                <Route path="/loja/:lojaSlug" element={<Navigate to="vitrine" replace />} />
                <Route path="/loja/:lojaSlug/vitrine" element={<ClientVitrine />} />
                <Route path="/loja/:lojaSlug/buscar" element={<ClientBuscar />} />
                <Route path="/loja/:lojaSlug/salvos" element={<ClientSalvos />} />
                <Route path="/loja/:lojaSlug/sobre" element={<ClientLoja />} />
                {/* Garage Academy — global, modo cliente */}
                <Route path="/academy" element={<ClientAcademy />} />
                <Route path="/academy/video/:id" element={<ClientAcademy />} />
                <Route path="/academy/:category" element={<ClientAcademy />} />
                {/* URL amigável canônica (loja + veículo) — por último para não eclipsar rotas estáticas */}
                <Route path="/:lojaSlug/:veiculoSlug" element={<ImovelPublic />} />
              </Route>

              {/* Corretor (logado) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminViewProvider><AppLayout /></AdminViewProvider>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/capacitacao" element={<Capacitacao />} />
                  <Route path="/ead" element={<EAD />} />
                  <Route path="/conhecimento" element={<Conhecimento />} />
                  <Route path="/rede" element={<MinhaRede />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/salvos" element={<Salvos />} />
                  <Route path="/atividade" element={<Atividade />} />
                  <Route path="/metricas" element={<Metricas />} />
                  <Route path="/perfil" element={<Perfil />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/lojas" element={<AdminLojas />} />
                  <Route path="/admin/lojistas" element={<AdminCorretores />} />
                  <Route path="/admin/aulas" element={<AdminAulas />} />
                  <Route path="/admin/leads" element={<AdminLeads />} />
                  <Route path="/admin/conhecimento" element={<AdminConhecimento />} />
                  {/* Convites: oculto da UI, rota mantida para compatibilidade */}
                  <Route path="/admin/convites" element={<AdminConvites />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
