import { Home, Video, GraduationCap, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type PublicTab = "portfolio" | "videos" | "conhecimento" | "capacitacao" | "perfil";

const items: { key: PublicTab; label: string; icon: typeof Home }[] = [
  { key: "portfolio", label: "Portfólio", icon: Home },
  { key: "videos", label: "Vídeos", icon: Video },
  { key: "conhecimento", label: "Saber", icon: BookOpen },
  { key: "capacitacao", label: "Capacitação", icon: GraduationCap },
  { key: "perfil", label: "Perfil", icon: User },
];

export function PublicBottomNav({
  active,
  onChange,
}: {
  active: PublicTab;
  onChange: (tab: PublicTab) => void;
}) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass-strong border-t-2 border-rose-gold/40 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  isActive
                    ? "text-accent [text-shadow:0_0_12px_hsl(var(--rose-gold)/0.6)]"
                    : "text-foreground/70 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
