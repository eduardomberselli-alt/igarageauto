import { Link } from "react-router-dom";
import { MapPin, Calendar, Gauge } from "lucide-react";
import { VehicleStatusBadges } from "@/components/VehicleStatusBadges";
import { FavoriteButton } from "@/components/FavoriteButton";
import { formatBRL } from "@/lib/format";
import { vehiclePath } from "@/lib/vehicleUrl";
import type { Property } from "@/types";

type Props = {
  property: Property;
  ownerSlug?: string | null;
};

export function ClientVehicleCard({ property: p, ownerSlug }: Props) {
  return (
    <article className="overflow-hidden rounded-2xl bg-[#141414] border border-white/5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.6)]">
      <Link to={vehiclePath(p, ownerSlug)} className="block">
        <div className="relative aspect-[4/3] bg-black/50">
          {p.fotoUrl && (
            <img
              src={p.fotoUrl}
              alt={p.titulo}
              loading="lazy"
              className={`h-full w-full object-cover ${p.vendido ? "grayscale-[40%]" : ""}`}
            />
          )}
          <VehicleStatusBadges property={p} max={2} />
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton vehicleId={p.id} size="md" />
          </div>
        </div>
      </Link>

      <div className="p-3.5">
        <Link to={vehiclePath(p, ownerSlug)}>
          <h3 className="font-semibold leading-tight line-clamp-1">{p.titulo}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-white/50">
          {p.year && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {p.year}
            </span>
          )}
          {p.km != null && (
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {p.km.toLocaleString("pt-BR")} km
            </span>
          )}
          {(p.city || p.bairro) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {p.city || p.bairro}
            </span>
          )}
        </div>
        <div className="mt-2.5">
          {p.vendido ? (
            <span className="text-sm font-bold text-[hsl(var(--primary))]">Vendido</span>
          ) : (
            <span className="text-xl font-extrabold text-[hsl(var(--primary))]">
              {formatBRL(p.preco)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
