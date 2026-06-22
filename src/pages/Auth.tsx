import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Mínimo 6 caracteres" }).max(100),
});

const signupSchema = loginSchema.extend({
  nome: z.string().trim().min(2, { message: "Informe seu nome" }).max(100),
  inviteCode: z.string().trim().max(32).optional().or(z.literal("")),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  const params = new URLSearchParams(location.search);
  // Aceita ?invite=XXX (legado) e ?code=XXX (link de convite atual via WhatsApp)
  const initialInvite = (params.get("invite") ?? params.get("code") ?? "").trim();
  const [tab, setTab] = useState<"login" | "signup">(initialInvite ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [inviteCode, setInviteCode] = useState(initialInvite.toUpperCase());
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, from, navigate]);

  // Ao abrir com ?invite=CODE, pré-preenche o nome a partir do invite (store_name)
  useEffect(() => {
    const code = inviteCode.trim().toUpperCase();
    if (!code || nome) return;
    (async () => {
      const { data } = await supabase
        .from("invites")
        .select("store_name,status")
        .eq("code", code)
        .maybeSingle();
      if (data && data.status === "pending" && (data as any).store_name) {
        setNome((data as any).store_name);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInvite]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ email, password, nome, inviteCode: inviteCode.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const codeUpper = (parsed.data.inviteCode ?? "").toUpperCase();
    // Se um código foi informado, valida antes de criar conta.
    // Se vazio, prossegue (backend permite quando não há admin no sistema = primeiro usuário).
    if (codeUpper.length > 0) {
      const { data: invRow, error: invErr } = await supabase
        .from("invites")
        .select("id,status,expires_at")
        .eq("code", codeUpper)
        .maybeSingle();
      if (invErr || !invRow || invRow.status !== "pending") {
        setBusy(false);
        toast.error("Código de convite inválido ou já utilizado");
        return;
      }
    }
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nome: parsed.data.nome, invite_code: codeUpper },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo ao Círculo Legacy!");
  };

  if (!loading && user) return <Navigate to={from} replace />;

  return (
    <div className="app-shell flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center animate-fade-in">
          <Logo size={64} />
          <h1 className="text-2xl font-bold mt-6 leading-tight tracking-tight">
            Venda seus carros com páginas profissionais
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Crie páginas para seus veículos e envie direto no WhatsApp para seus clientes
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar minha loja</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="animate-fade-in">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                Entrar
              </Button>
              <p className="text-xs text-center text-muted-foreground pt-1">
                Cada veículo recebe um link exclusivo para você enviar aos clientes
              </p>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="animate-fade-in">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="invite">Código de convite (opcional para o primeiro acesso)</Label>
                <Input
                  id="invite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Deixe em branco se for o primeiro admin"
                  className="font-mono tracking-wider uppercase"
                />
                <p className="text-[11px] text-muted-foreground">
                  Acesso exclusivo para lojistas convidados. O primeiro cadastro do sistema vira admin automaticamente.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-s">Email</Label>
                <Input id="email-s" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password-s">Senha</Label>
                <div className="relative">
                  <Input
                    id="password-s"
                    type={showPasswordSignup ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordSignup((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPasswordSignup ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={-1}
                  >
                    {showPasswordSignup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                Criar minha loja
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-center text-muted-foreground/70 mt-8">
          Feito para lojistas que querem vender mais no digital
        </p>
      </div>
    </div>
  );
}
