import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type Props = {
  requireAdmin?: boolean;
};

export function ProtectedRoute({ requireAdmin = false }: Props) {
  const { user, role, loading, isAdmin, profileStatus, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Bloqueia lojistas suspensos (admins continuam tendo acesso).
  if (!isAdmin && profileStatus === "suspended") {
    return (
      <div className="app-shell flex items-center justify-center px-6">
        <div className="max-w-sm w-full rounded-2xl bg-card border border-border p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold">Loja suspensa</h1>
          <p className="text-sm text-muted-foreground">
            Sua loja está temporariamente suspensa. Entre em contato com o administrador para
            reativá-la.
          </p>
          <Button variant="outline" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
