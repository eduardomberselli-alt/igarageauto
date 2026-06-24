import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, Property, Aula, VideoLink, Lead } from "@/types";

// =============== PROFILE ===============
export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId ?? user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!targetId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", targetId)
      .maybeSingle();
    if (data) {
      setProfile({
        id: data.id,
        userId: data.user_id,
        nome: data.nome,
        fotoUrl: data.foto_url,
        especialidades: data.especialidades ?? [],
        whatsapp: data.whatsapp,
        slug: (data as any).slug ?? null,
        address: (data as any).address ?? null,
        mapsUrl: (data as any).maps_url ?? null,
        instagramUrl: (data as any).instagram_url ?? null,
        facebookUrl: (data as any).facebook_url ?? null,
        tiktokUrl: (data as any).tiktok_url ?? null,
        youtubeUrl: (data as any).youtube_url ?? null,
        linkedinUrl: (data as any).linkedin_url ?? null,
        websiteUrl: (data as any).website_url ?? null,
        brandPrimaryColor: (data as any).brand_primary_color ?? "#722F37",
        brandAccentColor: (data as any).brand_accent_color ?? "#D4AF37",
        status: ((data as any).status ?? "active") as "active" | "suspended",
        urlMarcaDagua: (data as any).url_marca_dagua ?? null,
        logoLojaUrl: (data as any).logo_loja_url ?? null,
        urlCardWhatsapp: (data as any).url_card_whatsapp ?? null,
        fraseChamada: (data as any).frase_chamada ?? null,
      });
    }
    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = async (next: Partial<Profile>) => {
    if (!targetId) return;
    console.log("Salvando perfil:", { targetId, next });
    const payload: any = {
      user_id: targetId,
      nome: next.nome ?? "",
      foto_url: next.fotoUrl ?? "",
      especialidades: next.especialidades ?? [],
      whatsapp: next.whatsapp ?? "",
      ...(next.slug !== undefined ? { slug: next.slug } : {}),
      ...(next.address !== undefined ? { address: next.address } : {}),
      ...(next.mapsUrl !== undefined ? { maps_url: next.mapsUrl } : {}),
      ...(next.instagramUrl !== undefined ? { instagram_url: next.instagramUrl } : {}),
      ...(next.facebookUrl !== undefined ? { facebook_url: next.facebookUrl } : {}),
      ...(next.tiktokUrl !== undefined ? { tiktok_url: next.tiktokUrl } : {}),
      ...(next.youtubeUrl !== undefined ? { youtube_url: next.youtubeUrl } : {}),
      ...(next.linkedinUrl !== undefined ? { linkedin_url: next.linkedinUrl } : {}),
      ...(next.websiteUrl !== undefined ? { website_url: next.websiteUrl } : {}),
      ...(next.brandPrimaryColor !== undefined ? { brand_primary_color: next.brandPrimaryColor } : {}),
      ...(next.brandAccentColor !== undefined ? { brand_accent_color: next.brandAccentColor } : {}),
      ...(next.urlMarcaDagua !== undefined ? { url_marca_dagua: next.urlMarcaDagua } : {}),
      ...(next.logoLojaUrl !== undefined ? { logo_loja_url: next.logoLojaUrl } : {}),
      ...(next.urlCardWhatsapp !== undefined ? { url_card_whatsapp: next.urlCardWhatsapp } : {}),
      ...(next.fraseChamada !== undefined ? { frase_chamada: next.fraseChamada } : {}),
    };
    // Upsert garante que o registro é criado caso o trigger handle_new_user não tenha rodado
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .maybeSingle();
    console.log("Retorno do banco:", { data, error });
    if (error) {
      console.error("Erro ao salvar perfil:", error);
    }
    if (!error) {
      await refetch();
      // Notifica outras instâncias de useProfile (ex.: a do AppLayout) para
      // recarregar — assim as cores do corretor refletem em todo o app sem refresh.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { userId: targetId } }));
      }
    }
    return error;
  };

  useEffect(() => {
    if (!targetId) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: string } | undefined;
      if (!detail?.userId || detail.userId === targetId) refetch();
    };
    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, [targetId, refetch]);

  return { profile, loading, save, refetch };
}

// =============== PROPERTIES ===============
export function useProperties(opts?: { ownerId?: string; all?: boolean }) {
  const { user, isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("properties")
      .select("*, videos(*)")
      .order("created_at", { ascending: false });

    if (opts?.ownerId) {
      query = query.eq("owner_id", opts.ownerId);
    } else if (!opts?.all && user) {
      query = query.eq("owner_id", user.id);
    } else if (!user) {
      setProperties([]);
      setLoading(false);
      return;
    }

    const { data } = await query;
    if (data) {
      setProperties(
        data.map((p) => {
          const fotos = (p as any).fotos_urls ?? [];
          return {
            id: p.id,
            ownerId: p.owner_id,
            slug: (p as any).slug ?? null,
            titulo: p.titulo,
            preco: Number(p.preco),
            bairro: p.bairro,
            endereco: p.endereco,
            fotoUrl: p.foto_url || fotos[0] || "",
            fotosUrls: fotos,
            descricao: p.descricao,
            diferenciais: p.diferenciais ?? [],
            quartos: p.quartos,
            vendido: p.vendido,
            latitude: (p as any).latitude ?? null,
            longitude: (p as any).longitude ?? null,
            neighborhood: (p as any).neighborhood ?? null,
            year: (p as any).year ?? null,
            km: (p as any).km ?? null,
            city: (p as any).city ?? null,
            viewCountToday: (p as any).view_count_today ?? 0,
            whatsappClicksToday: (p as any).whatsapp_clicks_today ?? 0,
            lastPrice: (p as any).last_price != null ? Number((p as any).last_price) : null,
            publishedAt: (p as any).published_at ?? null,
            updatedAt: (p as any).updated_at ?? null,
            urlCardWhatsapp: (p as any).url_card_whatsapp ?? null,
            cardSignature: (p as any).card_signature ?? null,
            videos: ((p.videos as any[]) ?? []).map((v) => ({
              id: v.id,
              titulo: v.titulo,
              youtubeId: v.youtube_id,
            })),
          };
        }),
      );
    }
    setLoading(false);
  }, [user, opts?.ownerId, opts?.all]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = async (p: Omit<Property, "id" | "videos" | "ownerId">, ownerOverride?: string) => {
    const ownerId = ownerOverride ?? user?.id;
    if (!ownerId) return;
    const { error } = await supabase.from("properties").insert({
      owner_id: ownerId,
      titulo: p.titulo,
      preco: p.preco,
      bairro: p.bairro,
      endereco: p.endereco,
      foto_url: p.fotoUrl ?? p.fotosUrls?.[0] ?? "",
      fotos_urls: p.fotosUrls ?? [],
      descricao: p.descricao,
      diferenciais: p.diferenciais,
      quartos: p.quartos ?? 0,
      vendido: p.vendido ?? false,
      latitude: p.latitude ?? null,
      longitude: p.longitude ?? null,
      neighborhood: p.neighborhood ?? null,
      year: p.year ?? null,
      km: p.km ?? null,
      city: p.city ?? null,
    } as any);
    if (!error) await refetch();
    return error;
  };

  const update = async (id: string, p: Partial<Property>) => {
    const { error } = await supabase
      .from("properties")
      .update({
        titulo: p.titulo,
        preco: p.preco,
        bairro: p.bairro,
        endereco: p.endereco,
        foto_url: p.fotoUrl,
        ...(p.fotosUrls !== undefined ? { fotos_urls: p.fotosUrls } : {}),
        descricao: p.descricao,
        diferenciais: p.diferenciais,
        quartos: p.quartos,
        vendido: p.vendido,
        ...(p.latitude !== undefined ? { latitude: p.latitude } : {}),
        ...(p.longitude !== undefined ? { longitude: p.longitude } : {}),
        ...(p.neighborhood !== undefined ? { neighborhood: p.neighborhood } : {}),
        ...(p.year !== undefined ? { year: p.year } : {}),
        ...(p.km !== undefined ? { km: p.km } : {}),
        ...(p.city !== undefined ? { city: p.city } : {}),
      } as any)
      .eq("id", id);
    if (!error) await refetch();
    return error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (!error) await refetch();
    return error;
  };

  return { properties, loading, create, update, remove, refetch, isAdmin };
}

// =============== SINGLE PROPERTY (public) ===============
export function usePublicProperty(id: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProperty(null);
      setOwnerProfile(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setProperty(null);
      setOwnerProfile(null);

      const { data: p } = await supabase
        .from("properties")
        .select("*, videos(*)")
        .eq("id", id)
        .maybeSingle();

      if (!p) {
        setLoading(false);
        return;
      }

      const fotos = (p as any).fotos_urls ?? [];
      setProperty({
        id: p.id,
        ownerId: p.owner_id,
        slug: (p as any).slug ?? null,
        titulo: p.titulo,
        preco: Number(p.preco),
        bairro: p.bairro,
        endereco: p.endereco,
        fotoUrl: p.foto_url || fotos[0] || "",
        fotosUrls: fotos,
        descricao: p.descricao,
        diferenciais: p.diferenciais ?? [],
        quartos: p.quartos,
        vendido: p.vendido,
        latitude: (p as any).latitude ?? null,
        longitude: (p as any).longitude ?? null,
        neighborhood: (p as any).neighborhood ?? null,
        year: (p as any).year ?? null,
        km: (p as any).km ?? null,
        city: (p as any).city ?? null,
        viewCountToday: (p as any).view_count_today ?? 0,
        whatsappClicksToday: (p as any).whatsapp_clicks_today ?? 0,
        lastPrice: (p as any).last_price != null ? Number((p as any).last_price) : null,
        publishedAt: (p as any).published_at ?? null,
        updatedAt: (p as any).updated_at ?? null,
        urlCardWhatsapp: (p as any).url_card_whatsapp ?? null,
        cardSignature: (p as any).card_signature ?? null,
        videos: ((p.videos as any[]) ?? []).map((v) => ({
          id: v.id,
          titulo: v.titulo,
          youtubeId: v.youtube_id,
        })),
      });

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", p.owner_id)
        .maybeSingle();

      if (prof) {
        setOwnerProfile({
          id: prof.id,
          userId: prof.user_id,
          nome: prof.nome,
          fotoUrl: prof.foto_url,
          especialidades: prof.especialidades ?? [],
          whatsapp: prof.whatsapp,
          slug: (prof as any).slug ?? null,
          address: (prof as any).address ?? null,
          mapsUrl: (prof as any).maps_url ?? null,
          instagramUrl: (prof as any).instagram_url ?? null,
          facebookUrl: (prof as any).facebook_url ?? null,
          tiktokUrl: (prof as any).tiktok_url ?? null,
          youtubeUrl: (prof as any).youtube_url ?? null,
          linkedinUrl: (prof as any).linkedin_url ?? null,
          websiteUrl: (prof as any).website_url ?? null,
          brandPrimaryColor: (prof as any).brand_primary_color ?? "#722F37",
          brandAccentColor: (prof as any).brand_accent_color ?? "#D4AF37",
        });
      }

      setLoading(false);
    })();
  }, [id]);

  return { property, ownerProfile, loading };
}

// =============== SINGLE PROPERTY (public, by slug pair) ===============
export function usePublicPropertyBySlug(lojaSlug: string | undefined, vehicleSlug: string | undefined) {
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!lojaSlug || !vehicleSlug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      setLoading(true);
      setNotFound(false);
      setProperty(null);
      setOwnerProfile(null);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", lojaSlug)
        .maybeSingle();

      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: p } = await supabase
        .from("properties")
        .select("*, videos(*)")
        .eq("owner_id", prof.user_id)
        .eq("slug", vehicleSlug)
        .maybeSingle();

      if (!p) {
        setOwnerProfile({
          id: prof.id,
          userId: prof.user_id,
          nome: prof.nome,
          fotoUrl: prof.foto_url,
          especialidades: prof.especialidades ?? [],
          whatsapp: prof.whatsapp,
          slug: (prof as any).slug ?? null,
          address: (prof as any).address ?? null,
          mapsUrl: (prof as any).maps_url ?? null,
          instagramUrl: (prof as any).instagram_url ?? null,
          facebookUrl: (prof as any).facebook_url ?? null,
          tiktokUrl: (prof as any).tiktok_url ?? null,
          youtubeUrl: (prof as any).youtube_url ?? null,
          linkedinUrl: (prof as any).linkedin_url ?? null,
          websiteUrl: (prof as any).website_url ?? null,
          brandPrimaryColor: (prof as any).brand_primary_color ?? "#722F37",
          brandAccentColor: (prof as any).brand_accent_color ?? "#D4AF37",
        });
        setNotFound(true);
        setLoading(false);
        return;
      }

      const fotos = (p as any).fotos_urls ?? [];
      setProperty({
        id: p.id,
        ownerId: p.owner_id,
        slug: (p as any).slug ?? null,
        titulo: p.titulo,
        preco: Number(p.preco),
        bairro: p.bairro,
        endereco: p.endereco,
        fotoUrl: p.foto_url || fotos[0] || "",
        fotosUrls: fotos,
        descricao: p.descricao,
        diferenciais: p.diferenciais ?? [],
        quartos: p.quartos,
        vendido: p.vendido,
        latitude: (p as any).latitude ?? null,
        longitude: (p as any).longitude ?? null,
        neighborhood: (p as any).neighborhood ?? null,
        year: (p as any).year ?? null,
        km: (p as any).km ?? null,
        city: (p as any).city ?? null,
        viewCountToday: (p as any).view_count_today ?? 0,
        whatsappClicksToday: (p as any).whatsapp_clicks_today ?? 0,
        lastPrice: (p as any).last_price != null ? Number((p as any).last_price) : null,
        publishedAt: (p as any).published_at ?? null,
        videos: ((p.videos as any[]) ?? []).map((v) => ({
          id: v.id,
          titulo: v.titulo,
          youtubeId: v.youtube_id,
        })),
      });

      setOwnerProfile({
        id: prof.id,
        userId: prof.user_id,
        nome: prof.nome,
        fotoUrl: prof.foto_url,
        especialidades: prof.especialidades ?? [],
        whatsapp: prof.whatsapp,
        slug: (prof as any).slug ?? null,
        address: (prof as any).address ?? null,
        mapsUrl: (prof as any).maps_url ?? null,
        instagramUrl: (prof as any).instagram_url ?? null,
        facebookUrl: (prof as any).facebook_url ?? null,
        tiktokUrl: (prof as any).tiktok_url ?? null,
        youtubeUrl: (prof as any).youtube_url ?? null,
        linkedinUrl: (prof as any).linkedin_url ?? null,
        websiteUrl: (prof as any).website_url ?? null,
        brandPrimaryColor: (prof as any).brand_primary_color ?? "#722F37",
        brandAccentColor: (prof as any).brand_accent_color ?? "#D4AF37",
      });
      setLoading(false);
    })();
  }, [lojaSlug, vehicleSlug]);

  return { property, ownerProfile, loading, notFound };
}

// =============== VIDEOS ===============
export async function addVideo(propertyId: string, titulo: string, youtubeId: string) {
  return supabase.from("videos").insert({
    property_id: propertyId,
    titulo,
    youtube_id: youtubeId,
  });
}

export async function removeVideo(videoId: string) {
  return supabase.from("videos").delete().eq("id", videoId);
}

// =============== AULAS + PROGRESS ===============
export function useAulas() {
  const { user, isAdmin } = useAuth();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [progress, setProgress] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: aulasData } = await supabase
      .from("aulas")
      .select("*")
      .order("ordem", { ascending: true });
    if (aulasData) {
      setAulas(
        aulasData.map((a) => ({
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao,
          youtubeId: a.youtube_id,
          ordem: a.ordem,
        })),
      );
    }
    if (user) {
      const { data: progData } = await supabase
        .from("capacitacao_progress")
        .select("aula_id")
        .eq("user_id", user.id);
      if (progData) setProgress(new Set(progData.map((p) => p.aula_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggle = async (aulaId: string) => {
    if (!user) return;
    if (progress.has(aulaId)) {
      await supabase
        .from("capacitacao_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("aula_id", aulaId);
      setProgress((p) => {
        const n = new Set(p);
        n.delete(aulaId);
        return n;
      });
    } else {
      await supabase.from("capacitacao_progress").insert({
        user_id: user.id,
        aula_id: aulaId,
      });
      setProgress((p) => new Set(p).add(aulaId));
    }
  };

  const total = aulas.length;
  const done = aulas.filter((a) => progress.has(a.id)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;

  // Admin actions
  const createAula = async (a: Omit<Aula, "id">) => {
    const { error } = await supabase.from("aulas").insert({
      titulo: a.titulo,
      descricao: a.descricao,
      youtube_id: a.youtubeId,
      ordem: a.ordem,
    });
    if (!error) await refetch();
    return error;
  };

  const updateAula = async (id: string, a: Partial<Aula>) => {
    const { error } = await supabase
      .from("aulas")
      .update({
        titulo: a.titulo,
        descricao: a.descricao,
        youtube_id: a.youtubeId,
        ordem: a.ordem,
      })
      .eq("id", id);
    if (!error) await refetch();
    return error;
  };

  const deleteAula = async (id: string) => {
    const { error } = await supabase.from("aulas").delete().eq("id", id);
    if (!error) await refetch();
    return error;
  };

  return {
    aulas,
    progress,
    loading,
    toggle,
    total,
    done,
    percent,
    complete,
    isAdmin,
    createAula,
    updateAula,
    deleteAula,
  };
}

// =============== LEADS ===============
export function useLeads(opts?: { all?: boolean; ownerId?: string }) {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<(Lead & { propertyTitle?: string; ownerName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!user && !opts?.ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*, properties(titulo)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (opts?.ownerId) query = query.eq("owner_id", opts.ownerId);
    else if (!opts?.all && user) query = query.eq("owner_id", user.id);
    const { data } = await query;
    if (data) {
      const ownerIds = Array.from(new Set(data.map((l: any) => l.owner_id)));
      let ownerMap = new Map<string, string>();
      if (opts?.all && ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", ownerIds);
        (owners ?? []).forEach((o: any) => ownerMap.set(o.user_id, o.nome));
      }
      setLeads(
        data.map((l: any) => ({
          id: l.id,
          propertyId: l.property_id,
          ownerId: l.owner_id,
          createdAt: l.created_at,
          name: l.name ?? "",
          phone: l.phone ?? "",
          email: l.email,
          message: l.message,
          contacted: !!l.contacted,
          contactedAt: l.contacted_at,
          userAgent: l.user_agent,
          referrer: l.referrer,
          propertyTitle: l.properties?.titulo,
          ownerName: ownerMap.get(l.owner_id),
        })),
      );
    }
    setLoading(false);
  }, [user, opts?.all, opts?.ownerId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const markContacted = async (id: string, contacted: boolean) => {
    const { error } = await supabase
      .from("leads")
      .update({ contacted, contacted_at: contacted ? new Date().toISOString() : null })
      .eq("id", id);
    if (!error) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, contacted, contactedAt: contacted ? new Date().toISOString() : null } : l)));
    }
    return error;
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (!error) setLeads((prev) => prev.filter((l) => l.id !== id));
    return error;
  };

  return { leads, loading, isAdmin, refetch: fetchLeads, markContacted, deleteLead };
}

export async function registerLead(propertyId: string, ownerId: string) {
  return supabase.from("leads").insert({
    property_id: propertyId,
    owner_id: ownerId,
    name: "",
    phone: "",
    user_agent: navigator.userAgent.slice(0, 500),
    referrer: document.referrer.slice(0, 500) || null,
  });
}

// =============== USERS (admin) ===============
export type CorretorListItem = {
  userId: string;
  nome: string;
  fotoUrl: string;
  whatsapp: string;
  isAdmin: boolean;
  propertyCount: number;
};

export function useCorretores() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState<CorretorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: propsCount }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("properties").select("owner_id"),
    ]);

    const adminSet = new Set(
      (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
    );
    const counts = new Map<string, number>();
    (propsCount ?? []).forEach((p) => counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1));

    setList(
      (profiles ?? []).map((p) => ({
        userId: p.user_id,
        nome: p.nome,
        fotoUrl: p.foto_url,
        whatsapp: p.whatsapp,
        isAdmin: adminSet.has(p.user_id),
        propertyCount: counts.get(p.user_id) ?? 0,
      })),
    );
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const promoteAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (!error) await refetch();
    return error;
  };

  const demoteAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (!error) await refetch();
    return error;
  };

  const deleteCorretor = async (userId: string) => {
    // Pega o admin atual (quem está executando) — vira o novo dono dos imóveis/leads.
    const { data: { user: current } } = await supabase.auth.getUser();
    if (!current) return new Error("Não autenticado") as any;

    // 1) Transfere imóveis, leads e certificações para o admin atual via SECURITY DEFINER.
    const { error: eTransfer } = await supabase.rpc("transfer_corretor_to_admin", {
      _corretor_id: userId,
      _new_owner_id: current.id,
    });
    if (eTransfer) return eTransfer;

    // 2) Remove role e perfil — bloqueia o acesso do corretor à plataforma.
    const { error: e1 } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (e1) return e1;
    const { error: e2 } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (e2) return e2;

    await refetch();
    return null;
  };

  return { list, loading, refetch, promoteAdmin, demoteAdmin, deleteCorretor, deleteLojista: deleteCorretor };
}

// Alias com terminologia nova
export const useLojistas = useCorretores;
export type LojistaListItem = CorretorListItem;
