import type { Profile, Property } from "@/types";

/**
 * Constrói a URL amigável de um veículo no formato /:lojaSlug/:veiculoSlug.
 * Faz fallback para /veiculo/:id quando ainda não há slug disponível.
 */
export function vehiclePath(
  property: Pick<Property, "id" | "slug" | "ownerId">,
  ownerSlug?: string | null,
): string {
  if (ownerSlug && property.slug) {
    return `/${ownerSlug}/${property.slug}`;
  }
  return `/veiculo/${property.id}`;
}

export function vehicleUrl(
  property: Pick<Property, "id" | "slug" | "ownerId">,
  ownerSlug?: string | null,
  origin?: string,
): string {
  const o = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${o}${vehiclePath(property, ownerSlug)}`;
}
