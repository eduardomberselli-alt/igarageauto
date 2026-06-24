import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAcademyCategories,
  useAcademyVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  createCategory,
  updateCategory,
  deleteCategory,
  type AcademyCategory,
  type AcademyCategoryStatus,
  type AcademyVideo,
} from "@/data/academyData";
import { extractYoutubeId, ytThumb } from "@/lib/youtube";

/* -------------------------------------------------------------------------- */
/* Página                                                                      */
/* -------------------------------------------------------------------------- */

export default function AdminAcademy() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <header className="flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">Garage Academy</h2>
          <p className="text-xs text-muted-foreground">
            Gestão global de vídeos e categorias da Academy
          </p>
        </div>
      </header>

      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="videos">🎥 Vídeos</TabsTrigger>
          <TabsTrigger value="categories">🗂️ Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          <VideosTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-0">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Vídeos                                                                      */
/* -------------------------------------------------------------------------- */

function getThumb(v: AcademyVideo): string | null {
  if (v.thumbnail) return v.thumbnail;
  const yid = extractYoutubeId(v.videoUrl);
  return yid ? ytThumb(yid) : null;
}

const VIDEO_STATUS_LABEL: Record<AcademyVideo["status"], string> = {
  published: "Ativo",
  draft: "Rascunho",
  coming_soon: "Em breve",
};

function VideosTab() {
  const videos = useAcademyVideos();
  const categories = useAcademyCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademyVideo | null>(null);
  const [toDelete, setToDelete] = useState<AcademyVideo | null>(null);

  const sorted = useMemo(
    () => [...videos].sort((a, b) => a.order - b.order),
    [videos],
  );

  const startNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (v: AcademyVideo) => {
    setEditing(v);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteVideo(toDelete.id);
    toast.success("Vídeo removido");
    setToDelete(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sorted.length} conteúdo(s) cadastrado(s)
        </p>
        <Button size="sm" onClick={startNew} disabled={categories.length === 0}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-xs text-muted-foreground rounded-xl border border-border bg-card p-4">
          Crie ao menos uma categoria antes de adicionar vídeos.
        </p>
      )}

      {sorted.length === 0 && categories.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">
          Nenhum conteúdo cadastrado.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((v) => {
          const thumb = getThumb(v);
          const cat = categories.find((c) => c.id === v.category_id);
          return (
            <article
              key={v.id}
              className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3 shadow-[var(--shadow-card)]"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    #{v.order}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      v.status === "published"
                        ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                        : v.status === "draft"
                          ? "bg-secondary text-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {VIDEO_STATUS_LABEL[v.status]}
                  </span>
                  {cat && (
                    <span className="text-[10px] text-muted-foreground">
                      {cat.icon} {cat.name}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm truncate mt-0.5">{v.title}</p>
                {v.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {v.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => startEdit(v)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setToDelete(v)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <VideoFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        categories={categories}
        nextOrder={sorted.length + 1}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" será removido permanentemente.
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

function VideoFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AcademyVideo | null;
  categories: AcademyCategory[];
  nextOrder: number;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<AcademyVideo["status"]>("published");
  const [order, setOrder] = useState(1);
  const [duration, setDuration] = useState("");

  // Reset/preencher quando abrir
  useMemo(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setVideoUrl(editing.videoUrl);
      setThumbnail(editing.thumbnail ?? "");
      setCategoryId(editing.category_id);
      setStatus(editing.status);
      setOrder(editing.order);
      setDuration(editing.duration ?? "");
    } else {
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setThumbnail("");
      setCategoryId(categories[0]?.id ?? "");
      setStatus("published");
      setOrder(nextOrder);
      setDuration("");
    }
  }, [open, editing, categories, nextOrder]);

  const submit = () => {
    if (!title.trim()) return toast.error("Título obrigatório");
    if (!videoUrl.trim()) return toast.error("URL do vídeo obrigatória");
    if (!categoryId) return toast.error("Selecione uma categoria");

    const payload = {
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim(),
      thumbnail: thumbnail.trim() || null,
      category_id: categoryId,
      status,
      order: Number(order) || 1,
      duration: duration.trim() || null,
      featured: editing?.featured ?? false,
    };

    if (editing) {
      updateVideo(editing.id, payload);
      toast.success("Vídeo atualizado");
    } else {
      createVideo(payload);
      toast.success("Vídeo criado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar vídeo" : "Novo vídeo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL do vídeo (YouTube, Vimeo ou .mp4)</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>URL da thumbnail (opcional)</Label>
            <Input
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="Deixe vazio para usar a do YouTube"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AcademyVideo["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="coming_soon">Em breve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Duração (ex: 05:20)</Label>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Categorias                                                                  */
/* -------------------------------------------------------------------------- */

function CategoriesTab() {
  const categories = useAcademyCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademyCategory | null>(null);
  const [toDelete, setToDelete] = useState<AcademyCategory | null>(null);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order),
    [categories],
  );

  const startNew = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteCategory(toDelete.id);
    toast.success("Categoria removida");
    setToDelete(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sorted.length} categoria(s)
        </p>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3 shadow-[var(--shadow-card)]"
          >
            <span className="text-2xl" aria-hidden>
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-muted-foreground">
                  #{c.order}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    c.status === "active"
                      ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {c.status === "active" ? "Ativa" : "Em breve"}
                </span>
              </div>
              <p className="font-semibold text-sm truncate mt-0.5">{c.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {c.description}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditing(c);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setToDelete(c)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        nextOrder={sorted.length + 1}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" e todos os vídeos vinculados serão removidos.
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

function CategoryFormDialog({
  open,
  onOpenChange,
  editing,
  nextOrder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AcademyCategory | null;
  nextOrder: number;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [order, setOrder] = useState(1);
  const [status, setStatus] = useState<AcademyCategoryStatus>("active");

  useMemo(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setIcon(editing.icon);
      setOrder(editing.order);
      setStatus(editing.status);
    } else {
      setName("");
      setDescription("");
      setIcon("");
      setOrder(nextOrder);
      setStatus("active");
    }
  }, [open, editing, nextOrder]);

  const submit = () => {
    if (!name.trim()) return toast.error("Nome obrigatório");
    if (!icon.trim()) return toast.error("Informe um ícone (emoji ou nome)");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
      order: Number(order) || 1,
      status,
    };

    if (editing) {
      updateCategory(editing.id, payload);
      toast.success("Categoria atualizada");
    } else {
      createCategory(payload);
      toast.success("Categoria criada");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ícone (emoji ou nome Lucide)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🛡️"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AcademyCategoryStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="coming_soon">Em breve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="w-full">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}