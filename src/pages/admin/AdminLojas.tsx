import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
  Store,
  Plus,
  LogIn,
  Pause,
  Play,
  Trash2,
  Car,
  Inbox,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useAdminView } from "@/contexts/AdminViewContext";

type StoreRow = {
  userId: string;
  nome: string;
  fotoUrl: string;
  slug: string | null;
  whatsapp: string;
  status: "active" | "suspended";
  createdAt: string;
  propertyCount: number;
  leadCount: number;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const CreateSchema = z.object({
  storeName: z.string().trim().min(2, "Nome muito curto").max(120),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e -"),
  ownerName: z.string().trim().min(2, "Informe o nome do proprietário").max(120),
  email: z.string().trim().email("Email inválido").max(255),
  whatsapp: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
});

export default function AdminLojas() {
  const { user } = useAuth();
  const { enterStore } = useAdminView();
  const navigate = useNavigate();

  const [rows, setRows] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    storeName: "",
    slug: "",
    ownerName: "",
    email: "",
    whatsapp: "",
    password: "",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: props }, { data: leads }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, nome, foto_url, slug, whatsapp, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("properties").select("owner_id"),
      supabase.from("leads").select("owner_id"),
    ]);
    const pCount = new Map<string, number>();
    (props ?? []).forEach((p: any) => pCount.set(p.owner_id, (pCount.get(p.owner_id) ?? 0) + 1));
    const lCount = new Map<string, number>();
    (leads ?? []).forEach((l: any) => lCount.set(l.owner_id, (lCount.get(l.owner_id) ?? 0) + 1));
    setRows(
      (profiles ?? []).map((p: any) => ({
        userId: p.user_id,
        nome: p.nome ?? "Sem nome",
        fotoUrl: p.foto_url ?? "",
        slug: p.slug ?? null,
        whatsapp: p.whatsapp ?? "",
        status: (p.status ?? "active") as "active" | "suspended",
        createdAt: p.created_at,
        propertyCount: pCount.get(p.user_id) ?? 0,
        leadCount: lCount.get(p.user_id) ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = CreateSchema.safeParse({ ...form, slug: slugify(form.slug) });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Verifique os campos");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-store", {
      body: parsed.data,
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      const msg = (data as any)?.error;
      toast.error(typeof msg === "string" ? msg : error?.message ?? "Falha ao criar loja");
      return;
    }
    toast.success("Loja criada com sucesso");
    setForm({ storeName: "", slug: "", ownerName: "", email: "", whatsapp: "", password: "" });
    setOpen(false);
    load();
  };

  const toggleStatus = async (row: StoreRow) => {
    const next = row.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: next } as any)
      .eq("user_id", row.userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "suspended" ? "Loja suspensa" : "Loja reativada");
    setRows((prev) => prev.map((r) => (r.userId === row.userId ? { ...r, status: next } : r)));
  };

  const handleDelete = async (row: StoreRow) => {
    setDeletingId(row.userId);
    const { data, error } = await supabase.functions.invoke("delete-store", {
      body: { userId: row.userId, deleteAuthUser: true },
    });
    setDeletingId(null);
    if (error || (data as any)?.error) {
      const msg = (data as any)?.error;
      toast.error(typeof msg === "string" ? msg : error?.message ?? "Falha ao excluir");
      return;
    }
    toast.success("Loja excluída");
    setRows((prev) => prev.filter((r) => r.userId !== row.userId));
  };

  const handleEnter = (row: StoreRow) => {
    enterStore(row.userId, row.nome);
    navigate("/");
  };

  const handleEdit = (row: StoreRow) => {
    enterStore(row.userId, row.nome);
    navigate("/perfil");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "short" });

  return (
    <div className="px-4 pt-4 pb-12 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Lojas
          </h2>
          <p className="text-xs text-muted-foreground">
            {rows.length} cadastrada{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Loja
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova loja</DialogTitle>
              <DialogDescription>
                A conta é criada agora. Compartilhe email e senha com o lojista.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome da loja</Label>
                <Input
                  value={form.storeName}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      storeName: e.target.value,
                      slug: p.slug || slugify(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="minha-loja"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome do proprietário</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+55 (11) 98765-4321"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Senha provisória</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar Loja
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}

      {!loading && rows.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma loja cadastrada ainda.</p>
        </div>
      )}

      {!loading &&
        rows.map((row) => {
          const isOwner = row.userId === user?.id;
          return (
            <article
              key={row.userId}
              className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                <img
                  src={row.fotoUrl || "/placeholder.svg"}
                  alt={row.nome}
                  className="h-14 w-14 rounded-full object-cover bg-muted shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{row.nome}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        row.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {row.status === "active" ? "Ativa" : "Suspensa"}
                    </span>
                    {isOwner && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        Você
                      </span>
                    )}
                  </div>
                  {row.slug && (
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      /p/{row.slug}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Car className="h-3.5 w-3.5" />
                  {row.propertyCount} veículo{row.propertyCount === 1 ? "" : "s"}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Inbox className="h-3.5 w-3.5" />
                  {row.leadCount} lead{row.leadCount === 1 ? "" : "s"}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(row.createdAt)}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleEnter(row)}
                  disabled={isOwner}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleStatus(row)}
                  disabled={isOwner}
                >
                  {row.status === "active" ? (
                    <>
                      <Pause className="h-3.5 w-3.5" />
                      Suspender
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Reativar
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={isOwner}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir loja "{row.nome}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível. Veículos, leads, favoritos, vídeos, certificações
                        e a conta do usuário serão removidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground"
                        onClick={() => handleDelete(row)}
                      >
                        {deletingId === row.userId ? "Excluindo…" : "Excluir definitivamente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </article>
          );
        })}
    </div>
  );
}
