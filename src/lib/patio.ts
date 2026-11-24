import type { Property } from "@/types";

/** Ordem das vagas: disponíveis mais recentes primeiro, sem alterar a coleção original. */
export function getPatioProperties(properties: Property[]): Property[] {
  return properties
    .filter((property) => !property.vendido)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function getPatioExtraCount(properties: Property[], spotCount: number): number {
  return Math.max(0, getPatioProperties(properties).length - spotCount);
}
