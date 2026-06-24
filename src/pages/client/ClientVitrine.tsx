import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientVehicleCard } from "@/components/client/ClientVehicleCard";
import { AcademyHomeCard } from "@/components/academy/AcademyHomeCard";
import { SeoTags } from "@/components/SeoTags";
import { usePublicPortfolio } from "@/hooks/usePublicPortfolio";

type Filter = "recentes" | "disponivel";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function ClientVitrine() {
  const { lojaSlug } = useParams();
  const { profile, properties, loading, notFound } = usePublicPortfolio(lojaSlug);
  const [filter, setFilter] = useState<Filter>("recentes");

  const filtered = useMemo(() => {
    const now = Date.now();
    const available = properties.filter((p) => !p.vendido);
    const sorted = [...available].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    if (filter === "recentes") {
      return sorted.filter((p) => {
        if (!p.createdAt) return false;
        return now - new Date(p.createdAt).getTime() <= THIRTY_DAYS_MS;
      });
    }
    return sorted;
  }, [properties, filter]);

  const storeUrl = profile?.slug
    ? `https://igarageauto.vercel.app/p/${profile.slug}`
    : undefined;

  return (
    <>
      {profile && (
        <SeoTags
          title={profile.nome || "Garage"}
          description={profile.fraseChamada || "Confira nosso estoque completo!"}
          image={profile.urlCardWhatsapp || "/og-default.png"}
          imageType={profile.urlCardWhatsapp ? "image/jpeg" : "image/png"}
          url={storeUrl}
          type="website"
        />
      )}
      <ClientHeader />
      <main className="px-4 pt-4">
        <div className="flex items-end justify-between mb-3">
          <h1 className="text-xl font-extrabold tracking-tight">Vitrine</h1>
          {!loading && (
            <span className="text-[11px] text-white/40 uppercase tracking-wider">
              {filtered.length} veículo{filtered.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 mb-4">
          {(["recentes", "disponivel"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                filter === k
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                  : "bg-[#141414] text-white/70 border-white/10"
              }`}
            >
              {k === "recentes" ? "Recentes" : "Disponíveis"}
            </button>
          ))}
        </div>


        {loading && (
          <div className="grid grid-cols-1 gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {!loading && (notFound || !profile) && (
          <p className="text-sm text-white/50 text-center py-12">Loja não encontrada.</p>
        )}

        {!loading && filtered.length === 0 && profile && (
          <p className="text-sm text-white/50 text-center py-12">
            Nenhum veículo nesta categoria.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {filtered.map((p, idx) => {
            const card = (
              <ClientVehicleCard key={p.id} property={p} ownerSlug={profile?.slug} />
            );
            if (idx === 1) {
              return (
                <div key={p.id} className="contents">
                  {card}
                  <AcademyHomeCard />
                </div>
              );
            }
            return card;
          })}
          {filtered.length > 0 && filtered.length < 2 && <AcademyHomeCard />}
        </div>
      </main>
    </>
  );
}
