import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { House, Heart, PlusCircle, Bell, BarChart3, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useAppData";

type Item = {
  to: string;
  label: string;
  icon: typeof House;
  end?: boolean;
};

const baseItems: Item[] = [
  { to: "/", label: "Vitrine", icon: House, end: true },
  { to: "/salvos", label: "Salvos", icon: Heart },
  { to: "/atividade", label: "Atividade", icon: Bell },
  { to: "/metricas", label: "Métricas", icon: BarChart3 },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const isLojista = !!profile;

  // Lojista: Vitrine · Salvos · [+] · Atividade · Métricas · Perfil
  const items: (Item | { center: true })[] = isLojista
    ? [baseItems[0], baseItems[1], { center: true }, baseItems[2], baseItems[3], baseItems[4]]
    : baseItems;

  const handleAdd = () => {
    if (location.pathname !== "/") navigate("/");
    // Pequeno delay para garantir que a Vitrine montou e está ouvindo
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("app:new-property"));
    }, 60);
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-black/80 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((it, idx) => {
          if ("center" in it) {
            return (
              <li key="add" className="flex items-center justify-center py-1.5">
                <motion.button
                  type="button"
                  onClick={handleAdd}
                  aria-label="Adicionar veículo"
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="h-12 w-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.6)] -mt-5 border-4 border-[#0a0a0a]"
                >
                  <PlusCircle className="h-6 w-6" strokeWidth={2.2} />
                </motion.button>
              </li>
            );
          }
          const { to, label, icon: Icon, end } = it;
          return (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-medium transition-colors",
                    isActive ? "text-[#D4AF37]" : "text-[#666666] hover:text-foreground/80",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.span
                      animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className="inline-flex"
                    >
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={isActive ? 2.4 : 1.8}
                      />
                    </motion.span>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
