import { useEffect } from "react";
import { Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ClientStoreProvider, useClientStore } from "@/contexts/ClientStoreContext";
import { ClientBottomNav } from "./ClientBottomNav";
import { FloatingWhatsAppButton } from "./FloatingWhatsAppButton";
import { FloatingInstitutionalVideoButton } from "./FloatingInstitutionalVideoButton";

import { useBrandColors } from "@/hooks/useBrandColors";
import { useAuth } from "@/hooks/useAuth";

function StoreSyncFromUrl() {
  const params = useParams();
  const { setStoreBySlug, store } = useClientStore();
  const slugFromUrl = (params.lojaSlug as string | undefined) ?? null;

  useEffect(() => {
    if (slugFromUrl && slugFromUrl !== store?.slug) {
      setStoreBySlug(slugFromUrl);
    }
  }, [slugFromUrl, store?.slug, setStoreBySlug]);

  // Aplica cores da marca da loja atual em todo o shell do cliente
  useBrandColors(store?.brandPrimaryColor, store?.brandAccentColor, { applyTheme: true });
  return null;
}

function ClientShell() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const forceClient = searchParams.get("as") === "client";
  // Lojista logado vendo a página: esconder bottom nav (a menos que esteja em "Visualizar como cliente")
  const showBottomNav = forceClient || (!loading && !user);
  return (
    <div
      className="app-shell safe-bottom min-h-screen bg-[#0a0a0a]"
      style={{ paddingBottom: showBottomNav ? 80 : 0 }}
    >
      <StoreSyncFromUrl />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <FloatingWhatsAppButton />
      <FloatingInstitutionalVideoButton />
      {showBottomNav && <ClientBottomNav />}
    </div>
  );
}

export function ClientLayout() {
  return (
    <ClientStoreProvider>
      <ClientShell />
    </ClientStoreProvider>
  );
}
