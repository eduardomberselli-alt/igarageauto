export type PatioSpot = {
  x: number;
  y: number;
};

export type PatioMap = {
  id: string;
  nome: string;
  url: string;
  largura: number;
  altura: number;
  vagas: PatioSpot[];
};

export const DEFAULT_PATIO_MAP_ID = "carro-certo";

export const patioMaps: PatioMap[] = [
  {
    id: DEFAULT_PATIO_MAP_ID,
    nome: "Carro Certo",
    url: "/patio-maps/carro-certo.jpg",
    largura: 1280,
    altura: 1280,
    vagas: [
      // Showroom: os três veículos mais recentes.
      { x: 30.9, y: 32.4 },
      { x: 40.2, y: 32.4 },
      { x: 49.4, y: 32.4 },
      // Bloco esquerdo.
      { x: 13.3, y: 45.6 },
      { x: 19.4, y: 45.6 },
      { x: 25.6, y: 45.6 },
      { x: 31.4, y: 45.6 },
      { x: 12.6, y: 57.4 },
      { x: 18.9, y: 57.4 },
      { x: 25.0, y: 57.4 },
      { x: 31.1, y: 57.4 },
      { x: 11.7, y: 70.6 },
      { x: 18.0, y: 70.6 },
      { x: 24.1, y: 70.6 },
      { x: 30.3, y: 70.6 },
      { x: 10.8, y: 82.4 },
      { x: 17.2, y: 82.4 },
      { x: 23.7, y: 82.4 },
      { x: 30.2, y: 82.4 },
      // Bloco direito.
      { x: 65.0, y: 75.2 },
      { x: 72.0, y: 75.2 },
      { x: 79.8, y: 75.2 },
      // Fileira de cima.
      { x: 14.8, y: 12.2 },
      { x: 20.0, y: 12.2 },
      { x: 25.6, y: 12.2 },
      { x: 31.1, y: 12.2 },
      { x: 36.4, y: 12.2 },
      { x: 41.8, y: 12.2 },
    ],
  },
];

export function getPatioMap(id?: string | null): PatioMap {
  return patioMaps.find((map) => map.id === id) ?? patioMaps[0];
}
