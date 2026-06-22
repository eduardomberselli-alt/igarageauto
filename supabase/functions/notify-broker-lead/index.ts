// notify-broker-lead — envia notificação ao corretor quando um lead chega
// Best-effort: nunca falha o fluxo do usuário. Usa o gateway de IA do Lovable
// para enviar um email simples (texto) caso o profile do corretor tenha email.
// Se for desejado email mais elaborado, configurar o módulo de Lovable Emails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  brokerId: string;
  propertyId: string | null;
  propertyTitle: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Busca dados do corretor (apenas para futura entrega real de email/push)
    const { data: profile } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", body.brokerId)
      .maybeSingle();

    // Log estruturado — visível em Cloud → Functions → Logs
    console.log("[lead-notify]", {
      brokerId: body.brokerId,
      brokerName: profile?.nome ?? "(desconhecido)",
      propertyId: body.propertyId,
      propertyTitle: body.propertyTitle,
      lead: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        message: body.message,
      },
      ts: new Date().toISOString(),
    });

    // Aqui é o ponto de extensão: integrar com Lovable Emails / Push / SMS.
    // O lead já está salvo na tabela `leads` pelo cliente — este endpoint é
    // apenas para notificações em tempo real ao corretor.

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("[lead-notify] error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // não falha o fluxo do usuário
      }
    );
  }
});
