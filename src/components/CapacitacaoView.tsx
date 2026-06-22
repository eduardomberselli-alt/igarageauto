import { useState } from "react";
import { Plus, Pencil, Trash2, Award, GraduationCap, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/alert-dialog";
import { useCertifications } from "@/hooks/useCertifications";
import { CERTIFICATION_CATEGORIES, type Certification } from "@/types";

/**
 * Visualização de Cursos e Capacitação (CRECI, certificações, especializações).
 * Reutilizada dentro da página Perfil.
 */
export function CapacitacaoView() {
  const { items, loading, create, update, remove } = useCertifications();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [toDelete, setToDelete] = useState<Certification | null>(null);

  const [nome, setNome] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [ano, setAno] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("CRECI");

  const startNew = () => {
    setEditing(null);
    setNome("");
    setInstituicao("");
    setAno("");
    setCategoria("CRECI");
    setOpen(true);
  };

  const startEdit = (c: Certification) => {
    setEditing(c);
    setNome(c.nome);
    setInstituicao(c.instituicao);
    setAno(c.ano ? String(c.ano) : "");
    setCategoria(c.categoria || "Outro");
    setOpen(true);
  };

  const submit = async () => {
    if (!nome.trim()) return toast.error("Nome do curso obrigatório");
    const anoNum = ano ? Number(ano) : null;
    if (anoNum && (anoNum < 1950 || anoNum > new Date().getFullYear() + 1)) {
      return toast.error("Ano inválido");
    }
    const payload = {
      nome: nome.trim(),
      instituicao: instituicao.trim(),
      ano: anoNum,
      categoria,
    };
    const err = editing ? await update(editing.id, payload) : await create(payload);
    if (err) toast.error(err.message);
    else {
      toast.success(editing ? "Certificação atualizada" : "Certificação adicionada");
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const err = await remove(toDelete.id);
    if (err) toast.error(err.message);
    else toast.success("Certificação removida");
    setToDelete(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">Cursos e Capacitação</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Cursos, certificações e títulos do seu currículo profissional.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </header>

      {!loading && items.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-3 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[hsl(var(--gold))] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--gold))]">
              {items.length} {items.length === 1 ? "certificação" : "certificações"} no currículo
            </p>
            <p className="text-xs text-muted-foreground">
              Aparecem automaticamente no seu portfólio público.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center">
          <GraduationCap className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-sm">Nenhuma certificação cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Adicione seu CRECI, especializações e cursos para mostrar autoridade.
          </p>
          <Button onClick={startNew} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Adicionar primeira
          </Button>
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-border bg-background p-3 flex items-start gap-3"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {c.categoria && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary text-foreground px-2 py-0.5 rounded-full">
                    {c.categoria}
                  </span>
                )}
                {c.ano && (
                  <span className="text-[10px] font-bold text-muted-foreground">{c.ano}</span>
                )}
              </div>
              <p className="font-semibold leading-tight mt-1 text-sm">{c.nome}</p>
              {c.instituicao && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {c.instituicao}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => startEdit(c)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setToDelete(c)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar certificação" : "Nova certificação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome do curso / título</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: CRECI 12345-F"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instituição</Label>
              <Input
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                placeholder="Ex: COFECI / USP / FGV"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ano de conclusão</Label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="Ex: 2023"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} className="w-full">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover certificação?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.nome}" será removida do seu currículo público.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
