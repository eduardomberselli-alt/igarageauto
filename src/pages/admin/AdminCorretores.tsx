import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Shield, ShieldOff, UserPlus, Building2, Trash2 } from "lucide-react";
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
import { useLojistas } from "@/hooks/useAppData";
import { supabase } from "@/integrations/supabase/client";

const newUserSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
});

export default function AdminLojistas() {
  const { list, loading, refetch, promoteAdmin, demoteAdmin, deleteLojista } = useLojistas();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newUserSchema.safeParse({ nome, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    // Cria conta via signup (trigger handle_new_user cuida do profile + role)
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { nome: parsed.data.nome },
        // emailRedirectTo evita perda de sessão admin
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Lojista ${parsed.data.nome} criado`);
    setNome(""); setEmail(""); setPassword("");
    setOpen(false);
    setTimeout(refetch, 600);
  };

  const togglePromote = async (userId: string, isAdmin: boolean) => {
    const err = isAdmin ? await demoteAdmin(userId) : await promoteAdmin(userId);
    if (err) toast.error(err.message);
    else toast.success(isAdmin ? "Admin removido" : "Promovido a admin");
  };

  const handleDelete = async (userId: string, nome: string) => {
    const err = await deleteLojista(userId);
    if (err) toast.error(err.message);
    else toast.success(`${nome} removido`);
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lojistas</h2>
          <p className="text-xs text-muted-foreground">{list.length} cadastrado{list.length === 1 ? "" : "s"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4" />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar lojista</DialogTitle>
              <DialogDescription>
                A conta é criada na hora. Compartilhe email e senha com o lojista.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Senha provisória</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={busy}>
                  Criar conta
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && [0,1,2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}

      {!loading && list.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum lojista cadastrado ainda.
        </p>
      )}

      {!loading && list.map((c) => (
        <article
          key={c.userId}
          className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3 shadow-[var(--shadow-card)]"
        >
          <img
            src={c.fotoUrl || "/placeholder.svg"}
            alt={c.nome}
            className="h-12 w-12 rounded-full object-cover bg-muted shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm truncate">{c.nome || "Sem nome"}</p>
              {c.isAdmin && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5">
                  <Shield className="h-2.5 w-2.5" />
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{c.whatsapp || "Sem WhatsApp"}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              {c.propertyCount} veículo{c.propertyCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  {c.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {c.isAdmin ? "Remover acesso de admin?" : "Promover a admin?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {c.isAdmin
                      ? `${c.nome} perderá o acesso à área administrativa.`
                      : `${c.nome} terá acesso completo: gerenciar todos os veículos, lojistas, aulas e leads.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => togglePromote(c.userId, c.isAdmin)}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover lojista?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {c.nome} perderá o acesso à plataforma. Os {c.propertyCount} veículo{c.propertyCount === 1 ? "" : "s"}, leads e certificações serão transferidos para você.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => handleDelete(c.userId, c.nome)}
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </article>
      ))}
    </div>
  );
}
