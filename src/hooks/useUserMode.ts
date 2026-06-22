import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Define o modo de visualização da landing page de um veículo / loja.
 *
 * - `isAdminMode`: usuário logado E é dono do recurso (ou admin).
 *   Mostra ferramentas administrativas (Editar, Remover, Compartilhar, selo, "Modo prévia").
 * - `isClientMode`: usuário NÃO logado, OU logado mas usando `?as=client` para pré-visualizar.
 *
 * O parâmetro `ownerId` é opcional. Se omitido, qualquer usuário logado é tratado como admin.
 * Se informado, somente o dono ou admin entra em modo admin; outros logados caem em client mode.
 */
export function useUserMode(ownerId?: string | null) {
  const { user, isAdmin, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const forceClient = searchParams.get("as") === "client";

  return useMemo(() => {
    if (loading) {
      return { isAdminMode: false, isClientMode: true, forceClient, loading: true };
    }
    if (forceClient) {
      return { isAdminMode: false, isClientMode: true, forceClient: true, loading: false };
    }
    if (!user) {
      return { isAdminMode: false, isClientMode: true, forceClient: false, loading: false };
    }
    const isOwner = ownerId ? user.id === ownerId : true;
    const adminMode = isAdmin || isOwner;
    return {
      isAdminMode: adminMode,
      isClientMode: !adminMode,
      forceClient: false,
      loading: false,
    };
  }, [user, isAdmin, loading, ownerId, forceClient]);
}
