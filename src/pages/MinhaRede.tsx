import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInvites, useMyNetwork } from "@/hooks/useNetwork";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Share2, Trash2, Users, Mail, MessageCircle, Hash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const INVITE_LIMIT = 15;

export default function MinhaRede() {
  const { isAdmin } = useAuth();
  const { invitesQuery, createInvite, revokeInvite } = useInvites();
  const networkQuery = useMyNetwork();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const invites = invitesQuery.data ?? [];
  const usedSlots = invites.filter(i => i.status === "pending" || i.status === "accepted").length;
  const remaining = Math.max(INVITE_LIMIT - usedSlots, 0);

  const pending  = invites.filter(i => i.status === "pending");

  const OG_PROXY = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/og-preview`;
  const inviteUrl = (code: string) => `${OG_PROXY}?code=${encodeURIComponent(code)}`;

  const buildInviteMessage = (code: string) =>
    `Olá! Estou usando uma plataforma para lojistas de automóveis e quero te convidar.\n\n` +
    `🔑 Código: ${code}\n` +
    `🔗 Link: ${inviteUrl(code)}\n\n` +
    `É gratuito. Use meu código para entrar.`;

  const copy = async (text: string, label = "Copiado!") => {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const copyCode = (code: string) => copy(code, `Código ${code} copiado!`);

  const shareWhatsApp = (code: string) => {
    const text = encodeURIComponent(buildInviteMessage(code));
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const share = async (code: string) => {
    const text = buildInviteMessage(code);
    const url = inviteUrl(code);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Convite", text, url });
        return;
      } catch { /* fallback */ }
    }
    copy(text, "Mensagem copiada!");
  };

  const canInvite = isAdmin || remaining > 0;

  return (
    <div className="px-4 py-5 space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-2xl">Minha Rede</h1>
        <p className="text-sm text-muted-foreground">
          Convide outros lojistas para usar a plataforma
        </p>
      </header>

      {/* Contador */}
      <Card className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Convites</div>
            <div className="text-lg font-semibold">
              {isAdmin ? (
                <span>Ilimitado</span>
              ) : (
                <>{remaining} <span className="text-muted-foreground text-sm">de {INVITE_LIMIT} convites disponíveis</span></>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Sponsor */}
      {networkQuery.data?.sponsor && (
        <Card className="glass-card p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
            {networkQuery.data.sponsor.foto_url
              ? <img src={networkQuery.data.sponsor.foto_url} alt="" className="h-full w-full object-cover" />
              : <Users className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Você foi convidado por</div>
            <div className="font-medium">{networkQuery.data.sponsor.nome}</div>
          </div>
        </Card>
      )}

      {/* Gerar convite */}
      <Card className="glass-card p-4 space-y-3">
        <h2 className="font-semibold">Convidar lojista</h2>
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email do lojista (opcional)</Label>
            <Input
              id="email" type="email" placeholder="lojista@exemplo.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Input
              id="note" placeholder="Ex: Parceiro de Bento Gonçalves"
              value={note} onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            className="w-full" size="lg"
            disabled={!canInvite || createInvite.isPending}
            onClick={() => createInvite.mutate(
              { email: email.trim() || undefined, note },
              { onSuccess: () => { setEmail(""); setNote(""); } }
            )}
          >
            {!canInvite ? "Sem convites disponíveis" : "Gerar convite"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Convites são limitados para manter a qualidade da rede
          </p>
        </div>
      </Card>

      {/* Pendentes */}
      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" /> Convites pendentes
          <Badge variant="secondary">{pending.length}</Badge>
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>
        )}
        <div className="space-y-2">
          {pending.map((inv) => (
            <Card key={inv.id} className="glass-card p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <code className="font-mono text-sm tracking-wider text-accent">{inv.code}</code>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(inv.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              {inv.invitee_email && (
                <div className="text-xs text-muted-foreground">→ {inv.invitee_email}</div>
              )}
              {inv.note && <div className="text-xs">{inv.note}</div>}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => copyCode(inv.code)}>
                  <Hash className="h-3.5 w-3.5" /> Copiar Código
                </Button>
                <Button size="sm" variant="outline" onClick={() => copy(inviteUrl(inv.code), "Link copiado!")}>
                  <Copy className="h-3.5 w-3.5" /> Copiar Link
                </Button>
                <Button
                  size="sm"
                  className="bg-whatsapp text-white hover:bg-whatsapp/90"
                  onClick={() => shareWhatsApp(inv.code)}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => share(inv.code)}>
                  <Share2 className="h-3.5 w-3.5" /> Compartilhar
                </Button>
              </div>
              <Button
                size="sm" variant="ghost" className="w-full text-destructive"
                onClick={() => revokeInvite.mutate(inv.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Revogar convite
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Minha rede */}
      <section className="space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" /> Minha rede
          <Badge variant="secondary">{networkQuery.data?.invited.length ?? 0}</Badge>
        </h2>
        {(networkQuery.data?.invited.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">Você ainda não convidou nenhum lojista</p>
        )}
        <div className="space-y-2">
          {networkQuery.data?.invited.map((rel) => (
            <Card key={rel.id} className="glass-card p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {rel.profile?.foto_url
                  ? <img src={rel.profile.foto_url} alt="" className="h-full w-full object-cover" />
                  : <Users className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="font-medium">{rel.profile?.nome ?? "Lojista"}</div>
                <div className="text-xs text-muted-foreground">
                  Entrou em {format(new Date(rel.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              <Badge className="bg-accent/20 text-accent border border-accent/40">Ativo</Badge>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
