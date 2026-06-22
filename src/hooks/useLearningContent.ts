import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LearningContent, LearningAudience, LearningCategory } from "@/types";

function mapRow(r: any): LearningContent {
  return {
    id: r.id,
    categoria: r.categoria,
    audiencia: r.audiencia,
    titulo: r.titulo,
    descricao: r.descricao ?? "",
    youtubeId: r.youtube_id,
    ordem: r.ordem ?? 0,
  };
}

export function useLearningContent(audience: LearningAudience) {
  const [items, setItems] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("learning_content")
      .select("*")
      .order("ordem", { ascending: true });
    if (audience === "publico") {
      query = query.eq("audiencia", "publico");
    }
    const { data } = await query;
    setItems((data ?? []).map(mapRow));
    setLoading(false);
  }, [audience]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}

export function useAdminLearningContent() {
  const [items, setItems] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("learning_content")
      .select("*")
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });
    setItems((data ?? []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload: {
    categoria: LearningCategory;
    audiencia: LearningAudience;
    titulo: string;
    descricao: string;
    youtubeId: string;
    ordem: number;
  }) => {
    const { error } = await supabase.from("learning_content").insert({
      categoria: payload.categoria,
      audiencia: payload.audiencia,
      titulo: payload.titulo,
      descricao: payload.descricao,
      youtube_id: payload.youtubeId,
      ordem: payload.ordem,
    });
    if (!error) await load();
    return error;
  };

  const update = async (
    id: string,
    payload: Partial<{
      categoria: LearningCategory;
      audiencia: LearningAudience;
      titulo: string;
      descricao: string;
      youtubeId: string;
      ordem: number;
    }>,
  ) => {
    const dbPayload: any = { ...payload };
    if (payload.youtubeId !== undefined) {
      dbPayload.youtube_id = payload.youtubeId;
      delete dbPayload.youtubeId;
    }
    const { error } = await supabase.from("learning_content").update(dbPayload).eq("id", id);
    if (!error) await load();
    return error;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("learning_content").delete().eq("id", id);
    if (!error) await load();
    return error;
  };

  return { items, loading, create, update, remove, reload: load };
}
