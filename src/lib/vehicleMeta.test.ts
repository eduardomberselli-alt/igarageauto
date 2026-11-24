import { describe, expect, it } from "vitest";
import { emptyMeta, parseMeta } from "./vehicleMeta";

describe("parseMeta", () => {
  it("lê os metadados no formato chave:valor sem alterar seus valores", () => {
    const result = parseMeta([
      "marca:Toyota",
      "modelo:Corolla XEi",
      "ano:2024/2025",
      "km:12.340",
      "cambio:Automático",
      "combustivel:Flex",
      "carroceria:Sedan",
      "cor:Prata",
      "video:abc123",
      "opcional:Teto solar",
      "Único dono",
    ]);

    expect(result.meta).toEqual({
      marca: "Toyota",
      modelo: "Corolla XEi",
      ano: "2024/2025",
      km: "12.340",
      cambio: "Automático",
      combustivel: "Flex",
      carroceria: "Sedan",
      cor: "Prata",
      video: "abc123",
    });
    expect(result.rest).toEqual(["opcional:Teto solar", "Único dono"]);
  });

  it("mantém características desconhecidas fora dos metadados e não compartilha o estado vazio", () => {
    const first = parseMeta(["AIR CONDITIONING"]);
    first.meta.marca = "Fiat";
    const second = parseMeta([]);

    expect(first.rest).toEqual(["AIR CONDITIONING"]);
    expect(second.meta).toEqual(emptyMeta);
    expect(second.meta.marca).toBe("");
  });
});
