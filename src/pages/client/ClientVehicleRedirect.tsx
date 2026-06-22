import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve um veículo a partir apenas do `veiculoSlug` (sem loja na URL),
 * descobre o slug da loja dona e redireciona para a URL canônica
 * /:lojaSlug/:veiculoSlug — que renderiza a landing dentro do ClientLayout.
 */
export default function ClientVehicleRedirect() {
  const { veiculoSlug } = useParams();
  const [target, setTarget] = useState<string | null | "notfound">(null);

  useEffect(() => {
    if (!veiculoSlug) {
      setTarget("notfound");
      return;
    }
    (async () => {
      const { data: prop } = await supabase
        .from("properties")
        .select("owner_id, slug")
        .eq("slug", veiculoSlug)
        .limit(1)
        .maybeSingle();
      if (!prop) {
        setTarget("notfound");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("slug")
        .eq("user_id", prop.owner_id)
        .maybeSingle();
      if (prof?.slug && prop.slug) {
        setTarget(`/${prof.slug}/${prop.slug}`);
      } else {
        setTarget("notfound");
      }
    })();
  }, [veiculoSlug]);

  if (target === "notfound") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold mb-2">Veículo não encontrado</h1>
        <p className="text-sm text-white/50">Esta landing não existe ou foi removida.</p>
      </div>
    );
  }
  if (target) return <Navigate to={target} replace />;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-white/50">Carregando…</p>
    </div>
  );
}
