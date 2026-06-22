import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Property } from "@/types";

export function usePublicPortfolio(slugOrId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slugOrId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    (async () => {
      setLoading(true);
      setNotFound(false);

      // Tenta buscar por slug primeiro; se não, por user_id (uuid)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

      const baseQuery: any = supabase.from("profiles").select("*");
      const profQuery = isUuid ? baseQuery.eq("user_id", slugOrId) : baseQuery.eq("slug", slugOrId);

      const { data: prof } = await profQuery.maybeSingle();

      if (!prof) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile({
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

      const { data: props } = await supabase
        .from("properties")
        .select("*, videos(*)")
        .eq("owner_id", prof.user_id)
        .order("vendido", { ascending: true })
        .order("created_at", { ascending: false });

      if (props) {
        setProperties(
          props.map((p: any) => {
            const fotos = p.fotos_urls ?? [];
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
              latitude: p.latitude ?? null,
              longitude: p.longitude ?? null,
              neighborhood: p.neighborhood ?? null,
              year: p.year ?? null,
              km: p.km ?? null,
              city: p.city ?? null,
              viewCountToday: p.view_count_today ?? 0,
              whatsappClicksToday: p.whatsapp_clicks_today ?? 0,
              lastPrice: p.last_price != null ? Number(p.last_price) : null,
              publishedAt: p.published_at ?? null,
              createdAt: p.created_at ?? null,
              videos: ((p.videos as any[]) ?? []).map((v: any) => ({
                id: v.id,
                titulo: v.titulo,
                youtubeId: v.youtube_id,
              })),
            };
          }),
        );
      }
      setLoading(false);
    })();
  }, [slugOrId]);

  return { profile, properties, loading, notFound };
}
