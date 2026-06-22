import { useEffect, useState } from "react";
import { Network, Trash2, CheckCircle2, Clock, User, Copy, Plus, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  const prefix = (storeName || "GARAGE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "GARAGE";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}

export default function AdminConvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loading, setLoading] = useState(true);

  const [storeName, setStoreName] = useState("");
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
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
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!storeName.trim()) {
      toast.error("Informe o nome da loja");
      return;
    }
    setCreating(true);
    const code = generateCode(storeName.trim());
    const { error } = await supabase.from("invites").insert({
      code,
      inviter_id: user.id,
      store_name: storeName.trim(),
      status: "pending",
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Convite ${code} gerado`);
    setStoreName("");
    setOpenDialog(false);
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

  const totalUsados = invites.filter((i) => i.status === "accepted").length;
  const totalPendentes = invites.filter((i) => i.status === "pending").length;

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">
      <div>
        <h2 className="text-lg font-semibold">Convites</h2>
        <p className="text-xs text-muted-foreground">
          Gere convites ilimitados para novos lojistas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold">{invites.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{totalUsados}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Usados</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{totalPendentes}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Pendentes</p>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Gerar convite
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Novo convite</DialogTitle>
          </DialogHeader>
          <form onSubmit={createInvite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="store" className="text-sm font-medium">
                Nome da loja *
              </label>
              <Input
                id="store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Garage Premium"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={creating}>
                {creating ? "Gerando..." : "Criar convite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}

      {!loading && invites.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Network className="h-10 w-10 mx-auto mb-2 opacity-40" />
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
              className="rounded-2xl bg-card border border-border p-3 space-y-2"
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

              {i.store_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold truncate">{i.store_name}</span>
                </div>
              )}

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
                          O código <code className="font-mono">{i.code}</code> será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(i.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </article>
          );
        })}
    </div>
  );
}
