import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  storeName: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  ownerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8).max(100),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Valida JWT e role do chamador.
    const { data: userRes, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userRes?.user) return json({ error: "Token inválido" }, 401);
    const callerId = userRes.user.id;
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Apenas administradores" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { storeName, slug, ownerName, email, whatsapp, password } = parsed.data;

    // Slug deve ser único.
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) return json({ error: "Slug já utilizado" }, 409);

    // Cria usuário (não desconecta o admin pois usa service role).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome: ownerName },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
    }
    const newUserId = created.user.id;

    // Upsert profile (o trigger handle_new_user pode falhar por exigir invite_code; ignoramos
    // e garantimos o profile aqui usando service role).
    const { error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          nome: ownerName,
          whatsapp,
          slug,
          foto_url: "",
          especialidades: storeName ? [`sobre:${storeName}`] : [],
          status: "active",
        },
        { onConflict: "user_id" },
      );
    if (profErr) {
      await admin.auth.admin.deleteUser(newUserId).catch(() => {});
      return json({ error: profErr.message }, 400);
    }

    // Role corretor.
    await admin
      .from("user_roles")
      .upsert({ user_id: newUserId, role: "corretor" }, { onConflict: "user_id,role" });

    return json({ ok: true, user_id: newUserId });
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
