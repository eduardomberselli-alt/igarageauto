import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Ponte de rastreamento. URL pública: /c/:trackingCode
 *
 * Ao carregar:
 * 1. Dispara a Edge Function `track-share` no modo JSON, que registra o
 *    acesso (IP hash, user-agent, referrer) na tabela `share_tracking`.
 * 2. Recebe a `original_url` do veículo e redireciona o usuário para lá.
 * 3. Em caso de falha, faz fallback para a home.
 */
export default function ShareRedirect() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!trackingCode) {
        navigate("/", { replace: true });
        return;
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const trackUrl =
        `${SUPABASE_URL}/functions/v1/track-share/${encodeURIComponent(trackingCode)}?format=json`;

      try {
        const res = await fetch(trackUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const data = (await res.json()) as { original_url?: string };
          if (!cancelled && data.original_url) {
            // Se for URL absoluta para o mesmo domínio, navega via SPA preservando
            // a experiência. Caso contrário, faz redirect completo.
            try {
              const target = new URL(data.original_url, window.location.origin);
              if (target.origin === window.location.origin) {
                navigate(target.pathname + target.search + target.hash, { replace: true });
              } else {
                window.location.replace(data.original_url);
              }
            } catch {
              window.location.replace(data.original_url);
            }
            return;
          }
        }
      } catch {
        // segue para fallback
      }

      // Fallback: tenta resolver via tabela diretamente (RLS permite leitura pública? não.
      // Caso a função falhe, manda para a home).
      if (!cancelled) {
        // Último recurso: bate na função em modo redirect (302). Como é cross-origin,
        // o browser segue automaticamente para a `original_url`.
        window.location.replace(
          `${SUPABASE_URL}/functions/v1/track-share/${encodeURIComponent(trackingCode!)}`,
        );
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [trackingCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        <p className="text-sm text-white/70">Abrindo veículo…</p>
      </div>
    </div>
  );
}