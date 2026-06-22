import { useEffect, useState } from "react";
import { Trash2, CheckCircle2, Clock, User, Copy, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TOTAL_LIMIT = 10;

type InviteRow = {
  id: string;
  code: string;
  inviter_id: string;
  invitee_user_id: string | null;
  store_name: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  created_at: string;
  accepted_at: string | null;
};

type ProfileLite = { user_id: string; nome: string; foto_url: string };

const statusMeta: Record<InviteRow["status"], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", className: "bg-amber-500/20 text-amber-400", icon: Clock },
  accepted: { label: "Usado", className: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  revoked: { label: "Revogado", className: "bg-muted text-muted-foreground", icon: Trash2 },
  expired: { label: "Expirado", className: "bg-muted text-muted-foreground", icon: Trash2 },
};

function generateCode(storeName: string) {
  const prefix =
    (storeName || "LOJA")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8) || "LOJA";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

type Props = {
  storeName: string;
};

export function LojistaInvitesModal({ storeName }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: inv } = await supabase
      .from("invites")
      .select("*")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false });
    const list = (inv ?? []) as InviteRow[];
    setInvites(list);

    const ids = new Set<string>();
    list.forEach((i) => {
      if (i.invitee_user_id) ids.add(i.invitee_user_id);
    });
    if (ids.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nome, foto_url")
        .in("user_id", Array.from(ids));
      const map = new Map<string, ProfileLite>();
      (profs ?? []).forEach((p: any) => map.set(p.user_id, p));
      setProfiles(map);
    } else {
      setProfiles(new Map());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const usados = invites.filter((i) => i.status === "accepted").length;
  const pendentes = invites.filter((i) => i.status === "pending").length;
  const consumidos = usados + pendentes;
  const disponiveis = Math.max(TOTAL_LIMIT - consumidos, 0);
  const pct = Math.min(100, (disponiveis / TOTAL_LIMIT) * 100);

  const createInvite = async () => {
    if (!user) return;
    if (disponiveis <= 0) {
      toast.error("Você atingiu o limite de convites");
      return;
    }
    setCreating(true);
    const code = generateCode(storeName);
    const { error } = await supabase.from("invites").insert({
      code,
      inviter_id: user.id,
      store_name: storeName || "Minha loja",
      status: "pending",
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Convite ${code} gerado`);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("invites").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Convite excluído");
      setInvites((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const copyLink = async (code: string) => {
    const link = `${window.location.origin}/auth?invite=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          aria-label="Meus convites"
        >
          <Gift className="h-4 w-4" />
          Convites
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border text-foreground max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Meus convites
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Saldo */}
          <div className="rounded-2xl border border-border bg-background/50 p-4 space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">Convites disponíveis</p>
              <p className="text-2xl font-bold">
                <span className="text-primary">{disponiveis}</span>
                <span className="text-muted-foreground text-sm font-normal"> / {TOTAL_LIMIT}</span>
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <Button
              onClick={createInvite}
              disabled={creating || disponiveis <= 0}
              className="w-full gap-2 mt-2"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Gerando..." : "Gerar novo convite"}
            </Button>
            {disponiveis <= 0 && (
              <p className="text-[11px] text-center text-muted-foreground">
                Limite atingido. Convites usados não retornam ao saldo.
              </p>
            )}
          </div>

          {/* Lista */}
          {loading && [0, 1].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}

          {!loading && invites.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum convite gerado ainda.</p>
            </div>
          )}

          {!loading &&
            invites.map((i) => {
              const invitee = i.invitee_user_id ? profiles.get(i.invitee_user_id) : null;
              const meta = statusMeta[i.status];
              const Icon = meta.icon;
              return (
                <article
                  key={i.id}
                  className="rounded-2xl bg-background/50 border border-border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${meta.className}`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {meta.label.toUpperCase()}
                      </span>
                      <code className="text-[10px] font-mono text-muted-foreground truncate">
                        {i.code}
                      </code>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDate(i.created_at)}
                    </span>
                  </div>

                  {i.status === "accepted" && invitee && (
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {invitee.foto_url ? (
                          <img src={invitee.foto_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <User className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Usado por</p>
                        <p className="font-semibold truncate">{invitee.nome}</p>
                      </div>
                      {i.accepted_at && (
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                          {formatDate(i.accepted_at)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-primary border-primary/40 hover:bg-primary/10"
                      onClick={() => copyLink(i.code)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Compartilhar link
                    </Button>
                    {i.status === "pending" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive px-2">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir este convite?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O código <code className="font-mono">{i.code}</code> será removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(i.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </article>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
