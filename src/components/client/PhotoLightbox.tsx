import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

type Props = {
  open: boolean;
  photos: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt?: string;
};

export function PhotoLightbox({ open, photos, index, onClose, onIndexChange, alt }: Props) {
  const touchStartX = useRef<number | null>(null);
  const [dragDx, setDragDx] = useState(0);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      else if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, photos.length, onClose, onIndexChange]);

  if (!open || !photos.length) return null;

  const go = (dir: 1 | -1) => onIndexChange((index + dir + photos.length) % photos.length);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Fechar"
        className="absolute top-4 right-4 z-[9999] h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
        aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        className="absolute top-4 right-20 z-[9999] h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Foto anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-[9999] h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 items-center justify-center text-white transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Próxima foto"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-[9999] h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 items-center justify-center text-white transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
                  aria-label={`Ir para foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
            <div className="rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1 text-xs font-semibold text-white">
              {index + 1} / {photos.length}
            </div>
          </div>
        </>
      )}

      <div
        ref={imgWrapRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] flex items-center justify-center bg-black max-h-[92vh] max-w-[96vw]"
      >
        <img
          src={photos[index]}
          alt={alt ?? `Foto ${index + 1}`}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchMove={(e) => {
            if (touchStartX.current == null) return;
            setDragDx(e.touches[0].clientX - touchStartX.current);
          }}
          onTouchEnd={() => {
            const dx = dragDx;
            touchStartX.current = null;
            setDragDx(0);
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
          style={{ transform: `translateX(${dragDx}px)`, transition: dragDx === 0 ? "transform 0.2s ease" : "none" }}
          className="max-h-[92vh] max-w-[96vw] w-auto h-auto object-contain select-none [div:fullscreen_&]:max-h-screen [div:fullscreen_&]:max-w-full"
          draggable={false}
        />
      </div>
    </div>
  );
}
