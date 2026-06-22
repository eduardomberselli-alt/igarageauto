import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Altura em px (default 40 — recomendado para headers mobile) */
  size?: number;
  /** Mostra container branco arredondado para garantir contraste sobre fundos escuros */
  onDark?: boolean;
  className?: string;
};

/**
 * Logo Garage — ícone minimalista de carro + texto.
 * Usa lucide-react Car em dourado, consistente com o tema black & gold.
 */
export function Logo({ size = 40, onDark = false, className }: LogoProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-2",
        onDark && "rounded-2xl bg-white/95 px-3 py-1.5 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <Car
        size={size}
        className="text-[#D4AF37] shrink-0"
        strokeWidth={1.5}
      />
      <span
        className="font-semibold tracking-tight text-[#D4AF37]"
        style={{ fontSize: size * 0.55 }}
      >
        Garage
      </span>
    </div>
  );
}
