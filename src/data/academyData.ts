export type AcademyCategoryStatus = "active" | "coming_soon";

export type AcademyCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string; // emoji ou nome do ícone Lucide
  order: number;
  status: AcademyCategoryStatus;
  createdAt: string;
};

export type AcademyVideo = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  videoUrl: string;
  category_id: string;
  duration: string | null;
  featured: boolean;
  status: "published" | "draft";
  order: number;
  createdAt: string;
};

export const academyCategories: AcademyCategory[] = [
  {
    id: "cat-garage-seguro",
    slug: "garage-seguro",
    name: "Garage Seguro",
    description:
      "Aprenda a se proteger dos golpes mais comuns e faça negociações mais seguras.",
    icon: "🛡️",
    order: 1,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-documentacao",
    slug: "documentacao",
    name: "Documentação",
    description:
      "Transferência de veículos, ATPV-e, CRLV Digital e comunicação de venda.",
    icon: "📄",
    order: 2,
    status: "coming_soon",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-financiamento",
    slug: "financiamento",
    name: "Financiamento",
    description:
      "Como funciona, entrada ideal e cuidados com golpes financeiros.",
    icon: "💰",
    order: 3,
    status: "coming_soon",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-compra-inteligente",
    slug: "compra-inteligente",
    name: "Compra Inteligente",
    description:
      "Carro de leilão, quilometragem adulterada, checklist do usado e test-drive.",
    icon: "🚗",
    order: 4,
    status: "coming_soon",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat-manutencao",
    slug: "manutencao",
    name: "Manutenção",
    description:
      "Troca de óleo, pneus, bateria e sistema de arrefecimento.",
    icon: "🔧",
    order: 5,
    status: "coming_soon",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const academyVideos: AcademyVideo[] = [
  {
    id: "vid-anatomia-armadilha",
    title: "Anatomia de uma Armadilha",
    description:
      "Como funciona o golpe do intermediário e como evitar prejuízos.",
    thumbnail: null,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category_id: "cat-garage-seguro",
    duration: null,
    featured: true,
    status: "published",
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "vid-nova-era-fraudes",
    title: "A Nova Era das Fraudes",
    description:
      "WhatsApp clonado, inteligência artificial e golpes digitais.",
    thumbnail: null,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category_id: "cat-garage-seguro",
    duration: null,
    featured: false,
    status: "published",
    order: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "vid-compra-venda-seguranca",
    title: "Compra e Venda de Veículos com Segurança",
    description:
      "Os principais cuidados para negociar com tranquilidade.",
    thumbnail: null,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    category_id: "cat-garage-seguro",
    duration: null,
    featured: false,
    status: "published",
    order: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export function getCategoryBySlug(slug: string) {
  return academyCategories.find((c) => c.slug === slug) ?? null;
}

export function getCategoryById(id: string) {
  return academyCategories.find((c) => c.id === id) ?? null;
}

export function getVideosByCategoryId(id: string) {
  return academyVideos
    .filter((v) => v.category_id === id && v.status === "published")
    .sort((a, b) => a.order - b.order);
}

export function getVideoById(id: string) {
  return academyVideos.find((v) => v.id === id) ?? null;
}