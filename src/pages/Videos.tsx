import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties, addVideo, removeVideo } from "@/hooks/useAppData";
import { extractYoutubeId, ytEmbed, ytThumb } from "@/lib/youtube";

const MAX_VIDEOS_PER_PROPERTY = 5;

export default function Videos() {
  const { properties, loading, refetch } = useProperties();
  const [target, setTarget] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");

  const open = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (prop && prop.videos.length >= MAX_VIDEOS_PER_PROPERTY) {
      toast.error(`Limite de ${MAX_VIDEOS_PER_PROPERTY} vídeos por veículo atingido`);
      return;
    }
    setTarget(id);
    setTitulo("");
    setUrl("");
  };

  const add = async () => {
    if (!target) return;
    const yid = extractYoutubeId(url);
    if (!yid) {
      toast.error("URL do YouTube inválida");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Informe um título");
      return;
    }
    const { error } = await addVideo(target, titulo.trim(), yid);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vídeo adicionado");
    setTarget(null);
    await refetch();
  };

  const remove = async (videoId: string) => {
    const { error } = await removeVideo(videoId);
    if (error) toast.error(error.message);
    else {
      toast.success("Vídeo removido");
      await refetch();
    }
  };

  const copy = (videoId: string) => {
    navigator.clipboard.writeText(ytEmbed(videoId)).catch(() => {});
    toast.success("Link do vídeo copiado");
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Meus Vídeos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vincule vídeos do YouTube a cada veículo.
        </p>
      </header>

      {loading && <Skeleton className="h-40 w-full rounded-2xl" />}

      {!loading && properties.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum veículo cadastrado. Vá em "Portfólio" e adicione um.
        </p>
      )}

      {!loading && properties.length > 0 && (
        <Accordion type="multiple" className="space-y-3">
          {properties.map((p) => (
            <AccordionItem
              key={p.id}
              value={p.id}
              className="rounded-2xl border border-border bg-card px-4 shadow-[var(--shadow-card)]"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <img
                    src={p.fotoUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover bg-muted"
                  />
                  <div>
                    <p className="font-medium text-sm leading-tight">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.videos.length}/{MAX_VIDEOS_PER_PROPERTY} vídeo{p.videos.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2.5">
                  {p.videos.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      Nenhum vídeo ainda.
                    </p>
                  )}
                  {p.videos.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 rounded-xl bg-secondary p-2"
                    >
                      <img
                        src={ytThumb(v.youtubeId)}
                        alt=""
                        className="h-12 w-20 rounded-md object-cover bg-muted"
                      />
                      <p className="flex-1 text-sm font-medium truncate">{v.titulo}</p>
                      <Button size="icon" variant="ghost" onClick={() => copy(v.youtubeId)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(v.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {p.videos.length >= MAX_VIDEOS_PER_PROPERTY ? (
                    <p className="text-[11px] text-center text-muted-foreground py-2">
                      Limite de {MAX_VIDEOS_PER_PROPERTY} vídeos atingido. Remova um para adicionar outro.
                    </p>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => open(p.id)}>
                      <Plus className="h-4 w-4" />
                      Adicionar vídeo ({p.videos.length}/{MAX_VIDEOS_PER_PROPERTY})
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo vídeo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Tour Interno"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL do YouTube</Label>
              <Input
                placeholder="https://youtube.com/watch?v=…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={add} className="w-full">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
