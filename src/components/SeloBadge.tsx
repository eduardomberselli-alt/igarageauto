import { Award, Medal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

export type SeloTier = "ouro" | "prata" | "bronze";

/**
 * @deprecated Use o hook `useAuthorityBadge` para selo do corretor.
 * Esta função permanece apenas para badges por imóvel individual (legado).
 */
export function getSelo(p: Property, capacitacaoComplete: boolean): SeloTier {
  if (p.videos.length >= 3 && capacitacaoComplete) return "ouro";
  if (p.videos.length >= 1) return "prata";
  return "bronze";
}

const config: Record<
  SeloTier,
  { label: string; cls: string; Icon: typeof Trophy }
> = {
  ouro: {
    label: "Ouro",
    cls: "bg-gold/15 text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.4)]",
    Icon: Trophy,
  },
  prata: {
    label: "Prata",
    cls: "bg-silver/15 text-[hsl(var(--silver))] border-[hsl(var(--silver)/0.4)]",
    Icon: Medal,
  },
  bronze: {
    label: "Bronze",
    cls: "bg-bronze/15 text-[hsl(var(--bronze))] border-[hsl(var(--bronze)/0.4)]",
    Icon: Award,
  },
};

export function SeloBadge({
  tier,
  className,
}: {
  tier: SeloTier;
  className?: string;
}) {
  const { label, cls, Icon } = config[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
