import { describe, expect, it } from "vitest";
import { patioMaps } from "@/data/patioMaps";
import type { Property } from "@/types";
import { getPatioExtraCount, getPatioProperties } from "./patio";

function vehicle(id: string, createdAt: string, vendido = false): Property {
  return {
    id,
    ownerId: "owner",
    titulo: id,
    preco: 50000,
    bairro: "",
    endereco: "",
    fotoUrl: "",
    fotosUrls: [],
    descricao: "",
    diferenciais: [],
    videos: [],
    vendido,
    quartos: 0,
    createdAt,
  };
}

describe("pátio virtual", () => {
  it("mantém as 28 vagas e reserva as três primeiras para o showroom", () => {
    const map = patioMaps[0];
    expect(map.vagas).toHaveLength(28);
    expect(map.vagas.slice(0, 3)).toEqual([
      { x: 30.9, y: 32.4 },
      { x: 40.2, y: 32.4 },
      { x: 49.4, y: 32.4 },
    ]);
  });

  it("coloca os disponíveis mais recentes primeiro e exclui vendidos", () => {
    const old = vehicle("antigo", "2026-01-01T12:00:00Z");
    const newest = vehicle("novo", "2026-11-01T12:00:00Z");
    const middle = vehicle("intermediário", "2026-06-01T12:00:00Z");
    const sold = vehicle("vendido", "2026-12-01T12:00:00Z", true);
    const original = [old, sold, newest, middle];

    expect(getPatioProperties(original).map((p) => p.id)).toEqual([
      "novo",
      "intermediário",
      "antigo",
    ]);
    expect(original.map((p) => p.id)).toEqual(["antigo", "vendido", "novo", "intermediário"]);
  });

  it("informa quantos veículos ficaram fora das vagas disponíveis", () => {
    const properties = Array.from({ length: 30 }, (_, index) =>
      vehicle(`veículo ${index + 1}`, `2026-11-${String(index + 1).padStart(2, "0")}T12:00:00Z`),
    );

    expect(getPatioExtraCount(properties, 28)).toBe(2);
    expect(getPatioExtraCount(properties.slice(0, 28), 28)).toBe(0);
  });
});
