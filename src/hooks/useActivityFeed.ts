import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActivityKind = "hot_vehicle" | "price_drop" | "sold" | "many_views";

export type ActivityItem = {
  id: string;
  ownerId: string;
  vehicleId: string | null;
  tipo: ActivityKind;
  metadata: Record<string, any>;
  readAt: string | null;
  createdAt: string;
  vehicleTitulo: string | null;
  vehicleFotoUrl: string | null;
};

const PAGE_SIZE = 20;

export function useActivityFeed() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const map = (rows: any[]): ActivityItem[] =>
    rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      vehicleId: r.vehicle_id,
      tipo: r.tipo,
      metadata: r.metadata ?? {},
      readAt: r.read_at,
      createdAt: r.created_at,
      vehicleTitulo: r.properties?.titulo ?? r.metadata?.titulo ?? null,
      vehicleFotoUrl: r.properties?.foto_url ?? null,
    }));

  const fetchPage = useCallback(
    async (offset: number) => {
      if (!user) return [];
      const { data } = await supabase
        .from("activity_feed")
        .select("*, properties(titulo, foto_url)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      return map(data ?? []);
    },
    [user],
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    const first = await fetchPage(0);
    setItems(first);
    setHasMore(first.length === PAGE_SIZE);
    setLoading(false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = await fetchPage(items.length);
    setItems((prev) => [...prev, ...next]);
    setHasMore(next.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [fetchPage, hasMore, items.length, loadingMore]);

  // Inicial
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    refetch();
  }, [user, refetch]);

  // Realtime — novos eventos para este lojista
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`activity_feed:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          const row: any = payload.new;
          // Busca dados do veículo associado para enriquecer
          let vehicleTitulo: string | null = row.metadata?.titulo ?? null;
          let vehicleFotoUrl: string | null = null;
          if (row.vehicle_id) {
            const { data } = await supabase
              .from("properties")
              .select("titulo, foto_url")
              .eq("id", row.vehicle_id)
              .maybeSingle();
            if (data) {
              vehicleTitulo = data.titulo;
              vehicleFotoUrl = (data as any).foto_url;
            }
          }
          const item: ActivityItem = {
            id: row.id,
            ownerId: row.owner_id,
            vehicleId: row.vehicle_id,
            tipo: row.tipo,
            metadata: row.metadata ?? {},
            readAt: row.read_at,
            createdAt: row.created_at,
            vehicleTitulo,
            vehicleFotoUrl,
          };
          setItems((prev) =>
            prev.some((i) => i.id === item.id) ? prev : [item, ...prev],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { items, loading, hasMore, loadingMore, loadMore, refetch };
}
