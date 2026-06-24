export type VideoLink = {
  id: string;
  titulo: string;
  youtubeId: string;
};

export type Property = {
  id: string;
  ownerId: string;
  slug?: string | null;
  titulo: string;
  preco: number;
  bairro: string;
  endereco: string;
  fotoUrl: string;
  fotosUrls: string[];
  descricao: string;
  diferenciais: string[];
  videos: VideoLink[];
  vendido: boolean;
  quartos: number;
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  year?: number | null;
  km?: number | null;
  city?: string | null;
  viewCountToday?: number;
  whatsappClicksToday?: number;
  lastPrice?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

export const MAX_PROPERTY_PHOTOS = 10;

export const DIFERENCIAIS_PRESET = [
  "Piscina",
  "Área Rural",
  "Suíte",
  "Churrasqueira",
  "Garagem",
  "Varanda",
  "Jardim",
  "Vista Panorâmica",
] as const;

export type Profile = {
  id: string;
  userId: string;
  nome: string;
  fotoUrl: string;
  especialidades: string[];
  whatsapp: string;
  slug?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  status?: "active" | "suspended";
  urlMarcaDagua?: string | null;
  logoLojaUrl?: string | null;
  urlCardWhatsapp?: string | null;
};

export const DEFAULT_BRAND_PRIMARY = "#722F37";
export const DEFAULT_BRAND_ACCENT = "#D4AF37";

export const BRAND_PALETTES = [
  { key: "classico", label: "Clássico", primary: "#722F37", accent: "#D4AF37" },
  { key: "tropical", label: "Tropical", primary: "#FFD700", accent: "#00A86B" },
  { key: "oceano", label: "Oceano", primary: "#1B4965", accent: "#00CED1" },
  { key: "terra", label: "Terra", primary: "#CB6E4E", accent: "#E6C89A" },
  { key: "noturno", label: "Noturno", primary: "#6B21A5", accent: "#C0C0C0" },
  { key: "fogo", label: "Fogo", primary: "#FF6B35", accent: "#FFD166" },
  { key: "rose", label: "Rosé", primary: "#E8A0BF", accent: "#F5D7E3" },
  { key: "lavanda", label: "Lavanda", primary: "#C8A2D8", accent: "#F4E1F0" },
] as const;

export type Aula = {
  id: string;
  titulo: string;
  descricao: string;
  youtubeId: string;
  ordem: number;
};

export type Lead = {
  id: string;
  propertyId: string | null;
  ownerId: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  contacted: boolean;
  contactedAt?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
};

export type LearningCategory =
  | "engenharia_civil"
  | "juridico_contratos"
  | "documentacao"
  | "tecnica_vendas";

export type LearningAudience = "publico" | "corretor";

export type LearningContent = {
  id: string;
  categoria: LearningCategory;
  audiencia: LearningAudience;
  titulo: string;
  descricao: string;
  youtubeId: string;
  ordem: number;
};

export const LEARNING_CATEGORIES: { key: LearningCategory; label: string; publicOnly?: boolean }[] = [
  { key: "engenharia_civil", label: "Engenharia Civil" },
  { key: "juridico_contratos", label: "Jurídico e Contratos" },
  { key: "documentacao", label: "Documentação" },
  { key: "tecnica_vendas", label: "Técnica de Vendas" },
];

export type Certification = {
  id: string;
  ownerId: string;
  nome: string;
  instituicao: string;
  ano: number | null;
  categoria: string;
};

export const CERTIFICATION_CATEGORIES = [
  "CRECI",
  "Especialização",
  "Engenharia",
  "Avaliação de Imóveis",
  "Pós-graduação",
  "Curso Livre",
  "Outro",
] as const;
