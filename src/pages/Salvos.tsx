import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Trash2, ExternalLink, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { VehicleStatusBadges } from "@/components/VehicleStatusBadges";
import { formatBRL } from "@/lib/format";
import type { Property } from "@/types";

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

export default function Salvos() {
  const { ids, toggle, loading: favLoading } = useFavorites();
  const [items, setItems] = useState<Property[]>([]);
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
      const { data } = await supabase
        .from("properties")
        .select("*")
        .in("id", list);
      if (data) {
        // Mantém ordem em que foram favoritados (mais recentes primeiro = ordem reversa do Set)
        const order = new Map(list.map((id, i) => [id, i]));
        const mapped = data
          .map(mapRowToProperty)
          .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        setItems(mapped);
      }
      setLoading(false);
    })();
  }, [ids, favLoading]);

  const handleRemove = (id: string) => {
    toggle(id);
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-center mb-4">
        <Logo size={40} />
      </div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
          Salvos
        </h1>
        <p className="text-sm text-muted-foreground">
          {items.length > 0
            ? `${items.length} veículo${items.length === 1 ? "" : "s"} favoritado${items.length === 1 ? "" : "s"}`
            : "Veículos que você marcou para acompanhar."}
        </p>
      </header>

      {(loading || favLoading) && (
        <div className="space-y-4">
          {[0, 1].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !favLoading && items.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Nenhum veículo salvo ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Toque no ❤️ em qualquer veículo para acompanhar aqui.
          </p>
        </div>
      )}

      {!loading && !favLoading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((p) => (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {p.fotoUrl && (
                  <img
                    src={p.fotoUrl}
                    alt={p.titulo}
                    className={`h-full w-full object-cover ${p.vendido ? "grayscale-[40%]" : ""}`}
                    loading="lazy"
                  />
                )}
                <VehicleStatusBadges property={p} max={2} />
                <button
                  onClick={() => handleRemove(p.id)}
                  aria-label="Remover dos favoritos"
                  className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-rose-500/80 active:scale-90 transition-all"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold leading-tight">{p.titulo}</h3>
                  {p.bairro && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {p.bairro}
                    </p>
                  )}
                </div>
                {p.vendido ? (
                  <p className="text-base font-semibold text-primary">Vendido e Entregue</p>
                ) : (
                  <p className="text-xl font-bold text-primary">{formatBRL(p.preco)}</p>
                )}
                <Button asChild className="w-full">
                  <Link to={`/veiculo/${p.id}`}>
                    <ExternalLink className="h-4 w-4" />
                    Ver veículo
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
