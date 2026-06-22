import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  userId: z.string().uuid(),
  /** Quando true, remove também o registro em auth.users (irreversível). */
  deleteAuthUser: z.boolean().optional().default(true),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userRes, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userRes?.user) return json({ error: "Token inválido" }, 401);
    const callerId = userRes.user.id;

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Apenas administradores" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { userId, deleteAuthUser } = parsed.data;

    if (userId === callerId) return json({ error: "Você não pode excluir sua própria conta" }, 400);

    // Pega ids de propriedades para limpar dependências (videos, favorites, share_tracking).
    const { data: props } = await admin.from("properties").select("id").eq("owner_id", userId);
    const propertyIds = (props ?? []).map((p) => p.id);

    if (propertyIds.length > 0) {
      await admin.from("videos").delete().in("property_id", propertyIds);
      await admin.from("favorites").delete().in("property_id", propertyIds);
      await admin.from("share_tracking" as any).delete().in("vehicle_id", propertyIds);
    }

    await admin.from("leads").delete().eq("owner_id", userId);
    await admin.from("properties").delete().eq("owner_id", userId);
    await admin.from("certifications").delete().eq("owner_id", userId);
    await admin.from("activity_feed").delete().eq("owner_id", userId);
    await admin.from("favorites").delete().eq("user_id", userId);
    await admin.from("capacitacao_progress").delete().eq("user_id", userId);
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("user_id", userId);

    if (deleteAuthUser) {
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) return json({ ok: true, warning: `Dados removidos; auth: ${delErr.message}` });
    }

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message ?? "Erro inesperado" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
