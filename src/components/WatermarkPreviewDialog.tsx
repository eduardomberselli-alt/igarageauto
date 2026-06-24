import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, X } from "lucide-react";

type Props = {
  open: boolean;
  files: File[];
  uploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Pré-visualização das imagens já comprimidas e com a marca d'água "carimbada"
 * antes do upload para o Storage. Mostra:
 *  - Miniatura quadrada (object-cover) — igual ao card/carrossel
 *  - Pré-visualização cheia — igual ao lightbox
 */
export function WatermarkPreviewDialog({ open, files, uploading, onConfirm, onCancel }: Props) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);

  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  useEffect(() => {
    if (open) setIndex(0);
  }, [open, files.length]);

  if (files.length === 0) return null;
  const current = urls[index];
  const file = files[index];
  const sizeKb = file ? Math.round(file.size / 1024) : 0;

  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + files.length) % files.length);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && !uploading && onCancel()}>
        <DialogContent className="max-w-3xl bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Confira a marca d'água ({index + 1}/{files.length})
            </DialogTitle>
            <DialogDescription>
              Veja como a foto ficará no carrossel (miniatura quadrada) e em tela cheia.
              Confirme para enviar ou cancele para escolher outras imagens.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Miniatura — simula crop quadrado do card */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Miniatura (card / carrossel)</p>
              <div className="aspect-square w-full rounded-lg overflow-hidden bg-black border border-border">
                <img src={current} alt="preview miniatura" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Preview cheio — simula o lightbox */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tela cheia (lightbox)</p>
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="relative w-full aspect-square rounded-lg overflow-hidden bg-black border border-border group"
              >
                <img src={current} alt="preview cheio" className="w-full h-full object-contain" />
                <span className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-80 group-hover:opacity-100">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => go(-1)} disabled={files.length < 2}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => go(1)} disabled={files.length < 2}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground ml-2">~{sizeKb} KB</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading}>
                Cancelar
              </Button>
              <Button type="button" onClick={onConfirm} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>Confirmar e enviar {files.length} foto(s)</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox em tela cheia */}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95 border-0 rounded-none flex items-center justify-center">
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <img src={current} alt="preview tela cheia" className="max-w-full max-h-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}