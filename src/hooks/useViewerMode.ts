import { useAuth } from "@/hooks/useAuth";

export type ViewerMode = "client" | "owner" | "admin";

/**
 * Modo do visitante:
 * - "client": visitante anônimo (sem sessão Supabase)
 * - "owner": lojista logado (corretor)
 * - "admin": admin logado
 */
export function useViewerMode(): { mode: ViewerMode; loading: boolean } {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return { mode: "client", loading: true };
  if (!user) return { mode: "client", loading: false };
  if (isAdmin) return { mode: "admin", loading: false };
  return { mode: "owner", loading: false };
}

export function useIsClient(): boolean {
  return useViewerMode().mode === "client";
}
