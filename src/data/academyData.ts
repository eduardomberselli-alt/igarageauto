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
  status: "published" | "draft" | "coming_soon";
  order: number;
  createdAt: string;
};

const seedCategories: AcademyCategory[] = [
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

const seedVideos: AcademyVideo[] = [
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

/* -------------------------------------------------------------------------- */
/* Reactive in-memory store (persisted em localStorage).                       */
/* Preparado para troca direta por Supabase (academy_categories/_videos).      */
/* -------------------------------------------------------------------------- */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "garage.academy.v1";

type AcademyState = {
  categories: AcademyCategory[];
  videos: AcademyVideo[];
};

function loadInitial(): AcademyState {
  if (typeof window === "undefined") {
    return { categories: seedCategories, videos: seedVideos };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AcademyState;
      if (parsed.categories && parsed.videos) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { categories: seedCategories, videos: seedVideos };
}

let state: AcademyState = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function setState(next: AcademyState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

/* ---------------------------------- Hooks --------------------------------- */

export function useAcademyState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useAcademyCategories() {
  return useAcademyState().categories;
}

export function useAcademyVideos() {
  return useAcademyState().videos;
}

/* --------------------------------- Helpers -------------------------------- */

export function getCategoryBySlug(slug: string) {
  return state.categories.find((c) => c.slug === slug) ?? null;
}

export function getCategoryById(id: string) {
  return state.categories.find((c) => c.id === id) ?? null;
}

export function getVideosByCategoryId(id: string) {
  return state.videos
    .filter((v) => v.category_id === id && v.status === "published")
    .sort((a, b) => a.order - b.order);
}

export function getVideoById(id: string) {
  return state.videos.find((v) => v.id === id) ?? null;
}

// Compat: exporta a lista atual (não-reativa). Para reatividade use os hooks.
export const academyCategories = new Proxy([] as AcademyCategory[], {
  get(_t, prop) {
    const arr = state.categories;
    // @ts-expect-error proxy passthrough
    return arr[prop];
  },
}) as AcademyCategory[];

export const academyVideos = new Proxy([] as AcademyVideo[], {
  get(_t, prop) {
    const arr = state.videos;
    // @ts-expect-error proxy passthrough
    return arr[prop];
  },
}) as AcademyVideo[];

/* -------------------------------- Mutations ------------------------------- */

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resetAcademyData() {
  setState({ categories: seedCategories, videos: seedVideos });
}

/* ----------------------- Categorias ----------------------- */

export type CategoryInput = Omit<AcademyCategory, "id" | "createdAt" | "slug"> & {
  slug?: string;
};

export function createCategory(input: CategoryInput): AcademyCategory {
  const slug = (input.slug && slugify(input.slug)) || slugify(input.name);
  const item: AcademyCategory = {
    id: uid("cat"),
    slug,
    name: input.name,
    description: input.description,
    icon: input.icon,
    order: input.order,
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  setState({ ...state, categories: [...state.categories, item] });
  return item;
}

export function updateCategory(id: string, patch: Partial<CategoryInput>) {
  setState({
    ...state,
    categories: state.categories.map((c) =>
      c.id === id
        ? {
            ...c,
            ...patch,
            slug: patch.slug ? slugify(patch.slug) : patch.name ? slugify(patch.name) : c.slug,
          }
        : c,
    ),
  });
}

export function deleteCategory(id: string) {
  setState({
    ...state,
    categories: state.categories.filter((c) => c.id !== id),
    // remove vídeos órfãos
    videos: state.videos.filter((v) => v.category_id !== id),
  });
}

/* ------------------------- Vídeos ------------------------- */

export type VideoInput = Omit<AcademyVideo, "id" | "createdAt">;

export function createVideo(input: VideoInput): AcademyVideo {
  const item: AcademyVideo = {
    id: uid("vid"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  setState({ ...state, videos: [...state.videos, item] });
  return item;
}

export function updateVideo(id: string, patch: Partial<VideoInput>) {
  setState({
    ...state,
    videos: state.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  });
}

export function deleteVideo(id: string) {
  setState({ ...state, videos: state.videos.filter((v) => v.id !== id) });
}