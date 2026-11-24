export type AutoMeta = {
  marca: string;
  modelo: string;
  ano: string;
  km: string;
  cambio: string;
  combustivel: string;
  carroceria: string;
  cor: string;
  video: string;
};

export const emptyMeta: AutoMeta = {
  marca: "",
  modelo: "",
  ano: "",
  km: "",
  cambio: "",
  combustivel: "",
  carroceria: "",
  cor: "",
  video: "",
};

export const META_KEYS: (keyof AutoMeta)[] = [
  "marca",
  "modelo",
  "ano",
  "km",
  "cambio",
  "combustivel",
  "carroceria",
  "cor",
  "video",
];

export function parseMeta(diferenciais: string[]): { meta: AutoMeta; rest: string[] } {
  const meta: AutoMeta = { ...emptyMeta };
  const rest: string[] = [];

  for (const d of diferenciais) {
    const match = d.match(/^([a-z]+):(.*)$/i);
    if (match && (META_KEYS as string[]).includes(match[1].toLowerCase())) {
      meta[match[1].toLowerCase() as keyof AutoMeta] = match[2];
    } else {
      rest.push(d);
    }
  }

  return { meta, rest };
}
