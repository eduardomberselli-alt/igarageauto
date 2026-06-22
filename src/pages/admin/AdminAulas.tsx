import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/alert-dialog";
import { useAulas } from "@/hooks/useAppData";
import { extractYoutubeId, ytThumb } from "@/lib/youtube";
import type { Aula } from "@/types";

export default function AdminAulas() {
  const { aulas, loading, createAula, updateAula, deleteAula } = useAulas();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aula | null>(null);
  const [toDelete, setToDelete] = useState<Aula | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [ordem, setOrdem] = useState(1);

  const startNew = () => {
    setEditing(null);
    setTitulo(""); setDescricao(""); setUrl(""); setOrdem(aulas.length + 1);
    setOpen(true);
  };

  const startEdit = (a: Aula) => {
    setEditing(a);
    setTitulo(a.titulo); setDescricao(a.descricao);
    setUrl(`https://youtu.be/${a.youtubeId}`);
    setOrdem(a.ordem);
    setOpen(true);
  };

  const submit = async () => {
    if (!titulo.trim()) return toast.error("Título obrigatório");
    const yid = extractYoutubeId(url);
    if (!yid) return toast.error("URL do YouTube inválida");
    const payload = { titulo: titulo.trim(), descricao: descricao.trim(), youtubeId: yid, ordem };
    const err = editing ? await updateAula(editing.id, payload) : await createAula(payload);
    if (err) toast.error(err.message);
    else { toast.success(editing ? "Aula atualizada" : "Aula criada"); setOpen(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const err = await deleteAula(toDelete.id);
    if (err) toast.error(err.message);
    else toast.success("Aula removida");
    setToDelete(null);
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Aulas</h2>
          <p className="text-xs text-muted-foreground">
            Cursos exibidos para todos os lojistas
          </p>
        </div>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      {loading && [0,1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

      {!loading && aulas.map((a) => (
        <article
          key={a.id}
          className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3 shadow-[var(--shadow-card)]"
        >
          <img
            src={ytThumb(a.youtubeId)}
            alt=""
            className="h-14 w-20 rounded-lg object-cover bg-muted shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground">#{a.ordem}</span>
              <p className="font-semibold text-sm truncate">{a.titulo}</p>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.descricao}</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <Button size="icon" variant="ghost" onClick={() => startEdit(a)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setToDelete(a)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </article>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar aula" : "Nova aula"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>URL do YouTube</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input type="number" min={1} value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit} className="w-full">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover aula?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.titulo}" será removida e o progresso dos lojistas também.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
