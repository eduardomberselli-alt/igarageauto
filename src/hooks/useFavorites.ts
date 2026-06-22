import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SESSION_KEY = "emly_fav_session_id";
const LOCAL_KEY = "emly_fav_local"; // fallback offline cache

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto as any)?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readLocal(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function useFavorites() {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("favorites").select("vehicle_id");
    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      const sid = getOrCreateSessionId();
      query = query.eq("session_id", sid).is("user_id", null);
    }
    const { data, error } = await query;
    if (!error && data) {
      const set = new Set<string>(data.map((r: any) => r.vehicle_id));
      setIds(set);
      writeLocal(Array.from(set));
    } else {
      // fallback ao cache local se algo falhar
      setIds(new Set(readLocal()));
    }
    setLoading(false);
  }, [user]);

  // Migra favoritos anônimos -> conta logada
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      refetch();
      return;
    }
    (async () => {
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) {
        const { data: anon } = await supabase
          .from("favorites")
          .select("vehicle_id")
          .eq("session_id", sid)
          .is("user_id", null);
        if (anon && anon.length > 0) {
          const rows = anon.map((r: any) => ({
            user_id: user.id,
            vehicle_id: r.vehicle_id,
          }));
          // Insere ignorando duplicatas
          await supabase.from("favorites").upsert(rows, {
            onConflict: "user_id,vehicle_id",
            ignoreDuplicates: true,
          });
          // Limpa os anônimos
          await supabase
            .from("favorites")
            .delete()
            .eq("session_id", sid)
            .is("user_id", null);
        }
      }
      refetch();
    })();
  }, [user, authLoading, refetch]);

  const isFavorite = useCallback((vehicleId: string) => ids.has(vehicleId), [ids]);

  const toggle = useCallback(
    async (vehicleId: string) => {
      const has = ids.has(vehicleId);
      // Optimistic
      setIds((prev) => {
        const n = new Set(prev);
        has ? n.delete(vehicleId) : n.add(vehicleId);
        writeLocal(Array.from(n));
        return n;
      });

      if (has) {
        let q = supabase.from("favorites").delete().eq("vehicle_id", vehicleId);
        if (user) q = q.eq("user_id", user.id);
        else q = q.eq("session_id", getOrCreateSessionId()).is("user_id", null);
        const { error } = await q;
        if (error) {
          // rollback
          setIds((prev) => new Set(prev).add(vehicleId));
        }
      } else {
        const payload = user
          ? { user_id: user.id, vehicle_id: vehicleId, session_id: null }
          : { user_id: null, vehicle_id: vehicleId, session_id: getOrCreateSessionId() };
        const { error } = await supabase.from("favorites").insert(payload as any);
        if (error) {
          setIds((prev) => {
            const n = new Set(prev);
            n.delete(vehicleId);
            return n;
          });
        }
      }
    },
    [ids, user],
  );

  return { ids, isFavorite, toggle, loading, refetch };
}
