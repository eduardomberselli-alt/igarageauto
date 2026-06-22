import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Heart, Store } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavStoreSlug } from "@/contexts/ClientStoreContext";

const TABS = [
  { key: "vitrine", label: "Vitrine", icon: Home },
  { key: "buscar", label: "Buscar", icon: Search },
  { key: "salvos", label: "Salvos", icon: Heart },
  { key: "sobre", label: "Loja", icon: Store },
] as const;

export function ClientBottomNav() {
  const slug = useNavStoreSlug();
  const { pathname } = useLocation();

  // Sem loja conhecida não há para onde navegar pelas abas — esconder.
  if (!slug) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-black/85 backdrop-blur-xl border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ key, label, icon: Icon }) => {
          const to = `/loja/${slug}/${key}`;
          const isActive = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={key}>
              <NavLink
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-semibold transition-colors",
                  isActive ? "text-[hsl(var(--primary))]" : "text-white/55 hover:text-white/80",
                )}
              >
                <motion.span
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="inline-flex"
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                </motion.span>
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
