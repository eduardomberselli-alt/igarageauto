import { useEffect, useState } from "react";
import { Heart, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientVehicleCard } from "@/components/client/ClientVehicleCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/types";

type Item = { property: Property; ownerSlug: string | null; ownerNome: string | null };

function mapRowToProperty(p: any): Property {
  const fotos = p.fotos_urls ?? [];
  return {
    id: p.id,
    ownerId: p.owner_id,
    slug: p.slug ?? null,
    titulo: p.titulo,
    preco: Number(p.preco),
    bairro: p.bairro,
    endereco: p.endereco,
    fotoUrl: p.foto_url || fotos[0] || "",
    fotosUrls: fotos,
    descricao: p.descricao,
    diferenciais: p.diferenciais ?? [],
    quartos: p.quartos,
    vendido: p.vendido,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    neighborhood: p.neighborhood ?? null,
    year: p.year ?? null,
    km: p.km ?? null,
    city: p.city ?? null,
    viewCountToday: p.view_count_today ?? 0,
    whatsappClicksToday: p.whatsapp_clicks_today ?? 0,
    lastPrice: p.last_price != null ? Number(p.last_price) : null,
    publishedAt: p.published_at ?? null,
    videos: [],
  };
}

export default function ClientSalvos() {
  const { ids, loading: favLoading } = useFavorites();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favLoading) return;
    const list = Array.from(ids);
    if (list.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: props } = await supabase.from("properties").select("*").in("id", list);
      if (!props) {
        setLoading(false);
        return;
      }
      const ownerIds = Array.from(new Set(props.map((p: any) => p.owner_id)));
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, slug, nome")
        .in("user_id", ownerIds);
      const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
      const order = new Map(list.map((id, i) => [id, i]));
      const mapped: Item[] = props
        .map((p: any) => {
          const owner = profMap.get(p.owner_id);
          return {
            property: mapRowToProperty(p),
            ownerSlug: owner?.slug ?? null,
            ownerNome: owner?.nome ?? null,
          };
        })
        .sort((a, b) => (order.get(a.property.id) ?? 0) - (order.get(b.property.id) ?? 0));
      setItems(mapped);
      setLoading(false);
    })();
  }, [ids, favLoading]);

  const isLoading = loading || favLoading;

  return (
    <>
      <ClientHeader />
      <main className="px-4 pt-4">
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 mb-1">
          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          Salvos
        </h1>
        <p className="text-[11px] text-white/40 uppercase tracking-wider mb-4">
          {items.length} veículo{items.length === 1 ? "" : "s"}
        </p>

        {isLoading && (
          <div className="grid grid-cols-1 gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl bg-[#141414] border border-white/5 p-8 text-center mt-4">
            <Car className="h-10 w-10 mx-auto text-white/40 mb-3" />
            <p className="font-semibold">Nenhum veículo salvo ainda</p>
            <p className="text-xs text-white/50 mt-1">
              Toque no ❤️ em qualquer veículo para acompanhar aqui.
            </p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {items.map(({ property, ownerSlug, ownerNome }) => (
              <div key={property.id}>
                <ClientVehicleCard property={property} ownerSlug={ownerSlug} />
                {ownerNome && (
                  <p className="text-[11px] text-white/40 mt-1.5 px-1">
                    Anunciado por <span className="text-white/70">{ownerNome}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
