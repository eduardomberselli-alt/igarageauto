import { useDeferredValue, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientVehicleCard } from "@/components/client/ClientVehicleCard";
import { usePublicPortfolio } from "@/hooks/usePublicPortfolio";

export default function ClientBuscar() {
  const { lojaSlug } = useParams();
  const { profile, properties, loading } = usePublicPortfolio(lojaSlug);
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);

  const results = useMemo(() => {
    const term = deferred.trim().toLowerCase();
    if (!term) return properties;
    return properties.filter((p) => {
      const hay = [p.titulo, p.descricao, p.bairro, p.city, p.year?.toString(), ...(p.diferenciais ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [properties, deferred]);

  return (
    <>
      <ClientHeader />
      <main className="px-4 pt-4">
        <h1 className="text-xl font-extrabold tracking-tight mb-3">Buscar</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            placeholder="Marca, modelo, ano…"
            className="w-full h-12 pl-10 pr-10 rounded-2xl bg-[#141414] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Limpar"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-white/70" />
            </button>
          )}
        </div>

        {!loading && (
          <p className="text-[11px] text-white/40 uppercase tracking-wider mb-3">
            {results.length} resultado{results.length === 1 ? "" : "s"}
          </p>
        )}

        {!loading && results.length === 0 && (
          <p className="text-sm text-white/50 text-center py-12">
            Nenhum veículo encontrado.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3">
          {results.map((p) => (
            <ClientVehicleCard key={p.id} property={p} ownerSlug={profile?.slug} />
          ))}
        </div>
      </main>
    </>
  );
}
