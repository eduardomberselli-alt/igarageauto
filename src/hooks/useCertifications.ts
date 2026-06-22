import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Certification } from "@/types";

function mapRow(r: any): Certification {
  return {
    id: r.id,
    ownerId: r.owner_id,
    nome: r.nome,
    instituicao: r.instituicao ?? "",
    ano: r.ano ?? null,
    categoria: r.categoria ?? "",
  };
}

export function useCertifications(ownerId?: string) {
  const { user } = useAuth();
  const targetId = ownerId ?? user?.id;
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!targetId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("certifications")
      .select("*")
      .eq("owner_id", targetId)
      .order("ano", { ascending: false, nullsFirst: false });
    setItems((data ?? []).map(mapRow));
    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = async (payload: Omit<Certification, "id" | "ownerId">) => {
    if (!user) return new Error("Não autenticado");
    const { error } = await supabase.from("certifications").insert({
      owner_id: user.id,
      nome: payload.nome,
      instituicao: payload.instituicao,
      ano: payload.ano,
      categoria: payload.categoria,
    });
    if (!error) await refetch();
    return error;
  };

  const update = async (id: string, payload: Partial<Omit<Certification, "id" | "ownerId">>) => {
    const { error } = await supabase.from("certifications").update(payload).eq("id", id);
    if (!error) await refetch();
    return error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("certifications").delete().eq("id", id);
    if (!error) await refetch();
    return error;
  };

  return { items, loading, create, update, remove, refetch };
}
