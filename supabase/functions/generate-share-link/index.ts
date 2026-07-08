import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function nanoid(size = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < size; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Aceita chamadas anônimas (Modo Cliente) e autenticadas (Modo Lojista).
    // Sempre resolvemos o lojista_id a partir do próprio veículo, usando a
    // service role — assim o link rastreável é idêntico em ambos os modos.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const { vehicle_id, original_url } = body as {
      vehicle_id?: string;
      original_url?: string;
    };

    if (!vehicle_id || !original_url) {
      return new Response(
        JSON.stringify({ error: "vehicle_id e original_url obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: vehicle, error: vehicleErr } = await supabase
      .from("properties")
      .select("owner_id")
      .eq("id", vehicle_id)
      .maybeSingle();

    if (vehicleErr || !vehicle?.owner_id) {
      return new Response(JSON.stringify({ error: "Veículo não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tracking_code = nanoid(8);

    const { error } = await supabase.from("share_tracking").insert({
      lojista_id: vehicle.owner_id,
      vehicle_id,
      original_url,
      tracking_code,
      accessed_at: null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const tracking_link = `${supabaseUrl}/functions/v1/track-share/${tracking_code}`;

    return new Response(
      JSON.stringify({ tracking_link, tracking_code }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
