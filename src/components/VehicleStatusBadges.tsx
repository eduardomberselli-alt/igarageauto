import { Flame, Eye, MessageCircle, TrendingDown, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

type BadgeKind = "hot" | "sold" | "price_drop" | "many_views" | "views" | "interested" | "new";

interface BadgeDef {
  kind: BadgeKind;
  priority: number; // menor = mais importante
  icon: typeof Flame;
  label: string;
  className: string;
}

function buildBadges(p: Property): BadgeDef[] {
  const views = p.viewCountToday ?? 0;
  const clicks = p.whatsappClicksToday ?? 0;
  const priceDropped =
    p.lastPrice != null && p.lastPrice > 0 && p.preco < p.lastPrice;

  const out: BadgeDef[] = [];

  if (p.vendido) {
    out.push({
      kind: "sold",
      priority: 0,
      icon: CheckCircle2,
      label: "Vendido",
      className: "bg-emerald-600/95 text-white border border-emerald-400/40",
    });
  }

  const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : null;
  const isNew =
    !p.vendido &&
    createdAt != null &&
    Date.now() - createdAt <= 30 * 24 * 60 * 60 * 1000;
  if (isNew) {
    out.push({
      kind: "new",
      priority: 1,
      icon: Sparkles,
      label: "Novo",
      className: "bg-emerald-500 text-white border border-emerald-400/50",
    });
  }


  if (priceDropped) {
    out.push({
      kind: "price_drop",
      priority: 1,
      icon: TrendingDown,
      label: "Preço reduzido",
      className: "bg-[#D4AF37] text-black border border-[#D4AF37]",
    });
  }

  if (views > 50) {
    out.push({
      kind: "hot",
      priority: 2,
      icon: Flame,
      label: "Em alta",
      className:
        "bg-gradient-to-r from-orange-500 to-red-600 text-white border border-orange-400/40",
    });
  }

  if (clicks > 0) {
    out.push({
      kind: "interested",
      priority: 3,
      icon: MessageCircle,
      label: `${clicks} interessado${clicks === 1 ? "" : "s"}`,
      className: "bg-black/80 backdrop-blur text-white border border-white/15",
    });
  }

  if (views > 0 && views <= 50) {
    out.push({
      kind: "views",
      priority: 4,
      icon: Eye,
      label: `${views} viram hoje`,
      className: "bg-black/80 backdrop-blur text-white border border-white/15",
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}

interface Props {
  property: Property;
  max?: number;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Badges automáticos sobre a imagem do veículo.
 * Empilhados no canto superior esquerdo. Mostra os `max` mais relevantes.
 */
export function VehicleStatusBadges({
  property,
  max = 2,
  className,
  size = "sm",
}: Props) {
  const badges = buildBadges(property).slice(0, max);
  if (badges.length === 0) return null;

  const padding = size === "md" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[10px]";
  const iconSize = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <div
      className={cn(
        "absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5",
        className,
      )}
    >
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <span
            key={b.kind}
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6)] animate-fade-in",
              padding,
              b.className,
            )}
          >
            <Icon className={iconSize} strokeWidth={2.5} />
            {b.label}
          </span>
        );
      })}
    </div>
  );
}
