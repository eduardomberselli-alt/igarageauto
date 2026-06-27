import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

const LAST_STORE_KEY = "emly_last_store";

type ClientStore = Profile & { city?: string | null };

type Ctx = {
  store: ClientStore | null;
  loading: boolean;
  setStoreBySlug: (slug: string | null | undefined) => Promise<void>;
  setStoreFromProfile: (p: Profile | null) => void;
  lastStoreSlug: string | null;
  currentVehicle: { titulo: string; ano: string | null; url: string } | null;
  setCurrentVehicle: (v: { titulo: string; ano: string | null; url: string } | null) => void;
};

const ClientStoreContext = createContext<Ctx | undefined>(undefined);

function mapProfile(prof: any): ClientStore {
  return {
    id: prof.id,
    userId: prof.user_id,
    nome: prof.nome,
    fotoUrl: prof.foto_url,
    especialidades: prof.especialidades ?? [],
    whatsapp: prof.whatsapp,
    slug: prof.slug ?? null,
    address: prof.address ?? null,
    mapsUrl: prof.maps_url ?? null,
    instagramUrl: prof.instagram_url ?? null,
    facebookUrl: prof.facebook_url ?? null,
    tiktokUrl: prof.tiktok_url ?? null,
    youtubeUrl: prof.youtube_url ?? null,
    linkedinUrl: prof.linkedin_url ?? null,
    websiteUrl: prof.website_url ?? null,
    brandPrimaryColor: prof.brand_primary_color ?? "#722F37",
    brandAccentColor: prof.brand_accent_color ?? "#D4AF37",
  };
}

export function ClientStoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ClientStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Ctx["currentVehicle"]>(null);
  const lastFetched = useRef<string | null>(null);

  const lastStoreSlug =
    typeof window !== "undefined" ? localStorage.getItem(LAST_STORE_KEY) : null;

  const setStoreBySlug = useCallback(async (slug?: string | null) => {
    if (!slug) return;
    if (lastFetched.current === slug && store?.slug === slug) return;
    lastFetched.current = slug;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (data) {
      const mapped = mapProfile(data);
      setStore(mapped);
      try {
        localStorage.setItem(LAST_STORE_KEY, slug);
      } catch {}
    }
    setLoading(false);
  }, [store]);

  const setStoreFromProfile = useCallback((p: Profile | null) => {
    if (!p) return;
    setStore(p as ClientStore);
    if (p.slug) {
      try {
        localStorage.setItem(LAST_STORE_KEY, p.slug);
      } catch {}
    }
  }, []);

  const value = useMemo(
    () => ({ store, loading, setStoreBySlug, setStoreFromProfile, lastStoreSlug, currentVehicle, setCurrentVehicle }),
    [store, loading, setStoreBySlug, setStoreFromProfile, lastStoreSlug, currentVehicle],
  );

  return <ClientStoreContext.Provider value={value}>{children}</ClientStoreContext.Provider>;
}

export function useClientStore() {
  const ctx = useContext(ClientStoreContext);
  if (!ctx) throw new Error("useClientStore must be used within ClientStoreProvider");
  return ctx;
}

/** Variante segura que retorna null fora do provider (para componentes compartilhados). */
export function useOptionalClientStore() {
  return useContext(ClientStoreContext) ?? null;
}

/** Retorna o slug da loja preferido para navegação (atual > último visitado). */
export function useNavStoreSlug(): string | null {
  const { store, lastStoreSlug } = useClientStore();
  return store?.slug ?? lastStoreSlug ?? null;
}
