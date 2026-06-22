import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AuthorityTier = "bronze" | "prata" | "ouro";

export interface AuthorityStats {
  videosCount: number;       // vídeos próprios de imóveis do corretor
  certificationsCount: number;
  eadTotal: number;
  eadCompleted: number;
  eadPercent: number;        // 0..1
}

export interface AuthorityBadge {
  tier: AuthorityTier;
  stats: AuthorityStats;
  /** Cota de convites do Círculo Legacy: 3 / 5 / 10 */
  inviteQuota: number;
  /** Próximo nível e o que falta */
  next: null | { tier: AuthorityTier; missing: string[] };
}

/**
 * Regras explícitas:
 *  - Ouro:   videos >= 3  E  certs >= 5  E  EAD 100% concluído
 *  - Prata:  videos >= 1  E  certs >= 3
 *  - Bronze: padrão (qualquer outro caso)
 *
 * Computado em tempo real — nunca armazenado no banco.
 */
export function computeAuthority(stats: AuthorityStats): AuthorityBadge {
  const { videosCount, certificationsCount, eadTotal, eadPercent } = stats;
  const eadComplete = eadTotal > 0 && eadPercent >= 1;

  let tier: AuthorityTier = "bronze";
  if (videosCount >= 3 && certificationsCount >= 5 && eadComplete) {
    tier = "ouro";
  } else if (videosCount >= 1 && certificationsCount >= 3) {
    tier = "prata";
  }

  const inviteQuota = tier === "ouro" ? 10 : tier === "prata" ? 5 : 3;

  let next: AuthorityBadge["next"] = null;
  if (tier === "bronze") {
    const missing: string[] = [];
    if (videosCount < 1) missing.push("publique 1 vídeo de imóvel");
    if (certificationsCount < 3) missing.push(`adicione ${3 - certificationsCount} certificações`);
    next = { tier: "prata", missing };
  } else if (tier === "prata") {
    const missing: string[] = [];
    if (videosCount < 3) missing.push(`publique ${3 - videosCount} vídeo(s) de imóvel`);
    if (certificationsCount < 5) missing.push(`adicione ${5 - certificationsCount} certificações`);
    if (!eadComplete) missing.push("conclua 100% do EAD");
    next = { tier: "ouro", missing };
  }

  return { tier, stats, inviteQuota, next };
}

/**
 * Hook que calcula em tempo real o Selo de Autoridade do corretor logado.
 * Pode receber um userId opcional para calcular o selo de outro corretor (ex: portfólio público).
 */
export function useAuthorityBadge(userId?: string) {
  const { user } = useAuth();
  const ownerId = userId ?? user?.id;

  return useQuery({
    queryKey: ["authority-badge", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<AuthorityBadge> => {
      // 1) Vídeos próprios = vídeos vinculados a imóveis do corretor
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_id", ownerId!);
      const propIds = (props ?? []).map((p) => p.id);
      let videosCount = 0;
      if (propIds.length > 0) {
        const { count } = await supabase
          .from("videos")
          .select("id", { count: "exact", head: true })
          .in("property_id", propIds);
        videosCount = count ?? 0;
      }

      // 2) Certificações
      const { count: certCount } = await supabase
        .from("certifications")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", ownerId!);

      // 3) EAD — total de aulas e concluídas pelo corretor
      const { count: eadTotal } = await supabase
        .from("aulas")
        .select("id", { count: "exact", head: true });

      const { count: eadDone } = await supabase
        .from("capacitacao_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ownerId!);

      const total = eadTotal ?? 0;
      const done = eadDone ?? 0;
      const eadPercent = total > 0 ? Math.min(done / total, 1) : 0;

      return computeAuthority({
        videosCount,
        certificationsCount: certCount ?? 0,
        eadTotal: total,
        eadCompleted: done,
        eadPercent,
      });
    },
  });
}
