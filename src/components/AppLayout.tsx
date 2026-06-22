import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { AdminViewBanner } from "./AdminViewBanner";
import { useProfile } from "@/hooks/useAppData";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useAdminView } from "@/contexts/AdminViewContext";

export function AppLayout() {
  const { effectiveUserId } = useAdminView();
  const { profile } = useProfile(effectiveUserId);
  const location = useLocation();
  // Aplica as cores da marca do corretor (ou da loja visualizada) em TODAS as rotas logadas.
  useBrandColors(profile?.brandPrimaryColor, profile?.brandAccentColor);

  return (
    <div className="app-shell safe-bottom">
      <AdminViewBanner />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
