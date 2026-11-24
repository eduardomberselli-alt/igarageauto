import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientVehicleCard } from "@/components/client/ClientVehicleCard";
import { PatioView } from "@/components/client/PatioView";
import { SeoTags } from "@/components/SeoTags";
import { getPatioMap } from "@/data/patioMaps";
import { usePublicPortfolio } from "@/hooks/usePublicPortfolio";
import { getPatioProperties } from "@/lib/patio";

type Filter = "recentes" | "disponivel";
type VitrineView = "patio" | "lista";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function ClientVitrine() {
  const { lojaSlug } = useParams();
  const { profile, properties, loading, notFound } = usePublicPortfolio(lojaSlug);
  const [filter, setFilter] = useState<Filter>("recentes");
  const [view, setView] = useState<VitrineView>("lista");

  const patioEnabled = profile?.patioEnabled ?? false;
  const isPatio = patioEnabled && view === "patio";
  const storageKey = `garage:vitrine-view:${lojaSlug ?? profile?.slug ?? "loja"}`;

  useEffect(() => {
    if (!profile) return;
    if (!patioEnabled) {
      setView("lista");
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      setView(saved === "lista" || saved === "patio" ? saved : "patio");
    } catch {
      setView("patio");
    }
  }, [profile, patioEnabled, storageKey]);

  const available = useMemo(() => getPatioProperties(properties), [properties]);

  const filtered = useMemo(() => {
    if (filter === "recentes") {
      const now = Date.now();
      return available.filter((property) => {
        if (!property.createdAt) return false;
        return now - new Date(property.createdAt).getTime() <= THIRTY_DAYS_MS;
      });
    }
    return available;
  }, [available, filter]);

  const displayed = isPatio ? available : filtered;
  const patioMap = getPatioMap(profile?.patioMapId);

  const changeView = (nextView: VitrineView) => {
    setView(nextView);
    try {
      localStorage.setItem(storageKey, nextView);
    } catch {
      // A visualização continua funcionando quando o armazenamento está bloqueado.
    }
  };

  const urlAtual = `https://igarageauto.vercel.app/p/${lojaSlug ?? profile?.slug ?? ""}`;
  const nomeLoja = profile?.nome || "Garage";
  const descricaoLoja = profile?.fraseChamada || "Confira nosso estoque completo!";
  const imagemCard =
    profile?.urlCardWhatsapp || "https://igarageauto.vercel.app/og-default.png";

  return (
    <>
      <SeoTags
        title={nomeLoja}
        description={descricaoLoja}
        image={imagemCard}
        imageType={profile?.urlCardWhatsapp ? "image/jpeg" : "image/png"}
        url={urlAtual}
        type="website"
      />
      <ClientHeader />
      <main className="px-4 pt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight">Vitrine</h1>
          {!loading && (
            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-[11px] uppercase tracking-wider text-muted-foreground">
                {displayed.length} veículo{displayed.length === 1 ? "" : "s"}
              </span>
              {patioEnabled && (
                <div
                  className="flex rounded-full border border-border bg-secondary p-0.5"
                  role="group"
                  aria-label="Modo de visualização da vitrine"
                >
                  {(["patio", "lista"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => changeView(option)}
                      aria-pressed={view === option}
                      className={`min-h-8 rounded-full px-3 text-[11px] font-semibold transition-colors ${
                        view === option
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option === "patio" ? "Pátio" : "Lista"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isPatio && (
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
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
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {!loading && (notFound || !profile) && (
          <p className="py-12 text-center text-sm text-muted-foreground">Loja não encontrada.</p>
        )}

        {!loading && displayed.length === 0 && profile && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum veículo nesta categoria.
          </p>
        )}

        {!loading && isPatio && profile && displayed.length > 0 && (
          <PatioView
            properties={available}
            profile={profile}
            map={patioMap}
            onShowList={() => changeView("lista")}
          />
        )}

        {!loading && profile && (
          <div className={isPatio ? "hidden" : "grid grid-cols-1 gap-3"}>
            {filtered.map((p) => (
              <ClientVehicleCard key={p.id} property={p} ownerSlug={profile.slug} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
