import { useState, type CSSProperties } from "react";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt?: string;
  /** Tailwind classes para o container circular (tamanho, ring, shadow, bg). */
  className?: string;
  /** Tamanho do ícone de fallback. */
  fallbackIconClassName?: string;
};

/**
 * Logo circular padrão para lojas em telas públicas.
 *
 * - Container circular preservado (passado via className).
 * - `object-fit: contain` — nunca corta o logo.
 * - Padding interno dinâmico:
 *   • ~7.5% do container (logo ocupa ~85%) por padrão;
 *   • ~2.5% (até ~95%) quando a imagem é pequena/baixa resolução,
 *     evitando que apareça minúscula dentro do círculo.
 */
export function StoreLogo({ src, alt = "", className, fallbackIconClassName }: Props) {
  const [pad, setPad] = useState<string>("7.5%");

  if (!src) {
    return (
      <div
        className={cn(
          "rounded-full bg-white/5 flex items-center justify-center",
          className,
        )}
      >
        <Store className={cn("h-4 w-4 text-white/60", fallbackIconClassName)} />
      </div>
    );
  }

  const style: CSSProperties = { padding: pad };

  return (
    <div
      className={cn(
        "rounded-full bg-white/5 overflow-hidden flex items-center justify-center",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          const img = e.currentTarget;
          const min = Math.min(img.naturalWidth || 0, img.naturalHeight || 0);
          // Imagem pequena/baixa qualidade → reduz padding para preencher mais o círculo.
          if (min > 0 && min < 200) setPad("2.5%");
        }}
        className="h-full w-full object-contain"
        style={style}
      />
    </div>
  );
}
