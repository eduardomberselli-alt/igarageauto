import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const KEY = "garage:viewing_store_id";
const NAME_KEY = "garage:viewing_store_name";

type Ctx = {
  /** Id do dono da loja que o admin está visualizando. null = está em sua própria loja. */
  viewingStoreId: string | null;
  viewingStoreName: string | null;
  /** Id efetivo a ser usado nas queries de dados (impersonation quando aplicável). */
  effectiveUserId: string | undefined;
  /** Verdadeiro se o admin está visualizando outra loja. */
  isViewingOtherStore: boolean;
  enterStore: (userId: string, name: string) => void;
  exitStore: () => void;
};

const AdminViewContext = createContext<Ctx | undefined>(undefined);

export function AdminViewProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(KEY);
  });
  const [viewingStoreName, setViewingStoreName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(NAME_KEY);
  });

  // Sai do modo visualização automaticamente se o usuário deixar de ser admin.
  useEffect(() => {
    if (!isAdmin && viewingStoreId) {
      setViewingStoreId(null);
      setViewingStoreName(null);
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(NAME_KEY);
    }
  }, [isAdmin, viewingStoreId]);

  const enterStore = useCallback((userId: string, name: string) => {
    sessionStorage.setItem(KEY, userId);
    sessionStorage.setItem(NAME_KEY, name);
    setViewingStoreId(userId);
    setViewingStoreName(name);
  }, []);

  const exitStore = useCallback(() => {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(NAME_KEY);
    setViewingStoreId(null);
    setViewingStoreName(null);
  }, []);

  const value = useMemo<Ctx>(() => {
    const active = isAdmin && !!viewingStoreId;
    return {
      viewingStoreId: active ? viewingStoreId : null,
      viewingStoreName: active ? viewingStoreName : null,
      effectiveUserId: active ? viewingStoreId! : user?.id,
      isViewingOtherStore: active,
      enterStore,
      exitStore,
    };
  }, [isAdmin, viewingStoreId, viewingStoreName, user?.id, enterStore, exitStore]);

  return <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>;
}

export function useAdminView() {
  const ctx = useContext(AdminViewContext);
  if (!ctx) {
    // Fallback inerte fora do provider — comportamento normal de lojista.
    return {
      viewingStoreId: null,
      viewingStoreName: null,
      effectiveUserId: undefined,
      isViewingOtherStore: false,
      enterStore: () => {},
      exitStore: () => {},
    } as Ctx;
  }
  return ctx;
}
