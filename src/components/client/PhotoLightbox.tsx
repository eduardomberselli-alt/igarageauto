import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Fechar"
        className="absolute top-4 right-4 z-10 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center text-white transition"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label="Foto anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 items-center justify-center text-white transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label="Próxima foto"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 items-center justify-center text-white transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1 text-xs font-semibold text-white">
            {index + 1} / {photos.length}
          </div>
        </>
      )}

      <img
        src={photos[index]}
        alt={alt ?? `Foto ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
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
        className="max-h-[92vh] max-w-[96vw] object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
