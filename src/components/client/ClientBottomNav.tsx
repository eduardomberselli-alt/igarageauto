import { NavLink, useLocation } from "react-router-dom";
import { Home, Search, Heart, Store, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavStoreSlug } from "@/contexts/ClientStoreContext";

type Tab = {
  key: string;
  label: string;
  icon: typeof Home;
  /** rota global (não depende da loja) */
  global?: string;
};

const TABS: Tab[] = [
  { key: "vitrine", label: "Vitrine", icon: Home },
  { key: "buscar", label: "Buscar", icon: Search },
  { key: "academy", label: "Academy", icon: GraduationCap, global: "/academy" },
  { key: "salvos", label: "Salvos", icon: Heart },
  { key: "sobre", label: "Loja", icon: Store },
];

export function ClientBottomNav() {
  const slug = useNavStoreSlug();
  const { pathname } = useLocation();

  // Sem loja conhecida só mostramos a Academy (global) — ainda assim renderizamos a nav.
  const visibleTabs = slug ? TABS : TABS.filter((t) => t.global);
  if (visibleTabs.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-black/85 backdrop-blur-xl border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map(({ key, label, icon: Icon, global }) => {
          const to = global ?? `/loja/${slug}/${key}`;
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
