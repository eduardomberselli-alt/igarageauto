import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAdminLearningContent } from "@/hooks/useLearningContent";
import { extractYoutubeId, ytThumb } from "@/lib/youtube";
import {
  LEARNING_CATEGORIES,
  type LearningAudience,
  type LearningCategory,
  type LearningContent,
} from "@/types";

const AUDIENCE_OPTIONS: { value: LearningAudience; label: string }[] = [
  { value: "publico", label: "Público (cliente)" },
  { value: "corretor", label: "Lojista (privado)" },
];

export default function AdminConhecimento() {
  const { items, loading, create, update, remove } = useAdminLearningContent();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LearningContent | null>(null);
  const [toDelete, setToDelete] = useState<LearningContent | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const [ordem, setOrdem] = useState(1);
  const [categoria, setCategoria] = useState<LearningCategory>("engenharia_civil");
  const [audiencia, setAudiencia] = useState<LearningAudience>("publico");

  const startNew = () => {
    setEditing(null);
    setTitulo("");
    setDescricao("");
    setUrl("");
    setOrdem(items.length + 1);
    setCategoria("engenharia_civil");
    setAudiencia("publico");
    setOpen(true);
  };

  const startEdit = (i: LearningContent) => {
    setEditing(i);
    setTitulo(i.titulo);
    setDescricao(i.descricao);
    setUrl(`https://youtu.be/${i.youtubeId}`);
    setOrdem(i.ordem);
    setCategoria(i.categoria);
    setAudiencia(i.audiencia);
    setOpen(true);
  };

  const submit = async () => {
    if (!titulo.trim()) return toast.error("Título obrigatório");
    const yid = extractYoutubeId(url);
    if (!yid) return toast.error("URL do YouTube inválida");
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      youtubeId: yid,
      ordem,
      categoria,
      audiencia,
    };
    const err = editing ? await update(editing.id, payload) : await create(payload);
    if (err) toast.error(err.message);
    else {
      toast.success(editing ? "Conteúdo atualizado" : "Conteúdo criado");
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const err = await remove(toDelete.id);
    if (err) toast.error(err.message);
    else toast.success("Conteúdo removido");
    setToDelete(null);
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Conhecimento</h2>
          <p className="text-xs text-muted-foreground">
            Vídeos do YouTube por categoria, exibidos para cliente e/ou lojista
          </p>
        </div>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {loading && [0, 1].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

      {!loading && items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhum conteúdo cadastrado.
        </p>
      )}

      {LEARNING_CATEGORIES.map((cat) => {
        const list = items.filter((i) => i.categoria === cat.key);
        if (list.length === 0) return null;
        return (
          <section key={cat.key} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {cat.label}
            </h3>
            {list.map((i) => (
              <article
                key={i.id}
                className="rounded-2xl bg-card border border-border p-3 flex items-center gap-3 shadow-[var(--shadow-card)]"
              >
                <img
                  src={ytThumb(i.youtubeId)}
                  alt=""
                  className="h-14 w-20 rounded-lg object-cover bg-muted shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">#{i.ordem}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        i.audiencia === "publico"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {i.audiencia === "publico" ? "Público" : "Lojista"}
                    </span>
                    <p className="font-semibold text-sm truncate">{i.titulo}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {i.descricao}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(i)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </article>
            ))}
          </section>
        );
      })}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria(v as LearningCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Audiência</Label>
              <Select
                value={audiencia}
                onValueChange={(v) => setAudiencia(v as LearningAudience)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL do YouTube</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input
                type="number"
                min={1}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
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
            <AlertDialogTitle>Remover conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.titulo}" será removido permanentemente.
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
