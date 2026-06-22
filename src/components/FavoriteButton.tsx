import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

type Props = {
  vehicleId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** "floating" => pílula escura sobreposta na imagem; "ghost" => apenas ícone */
  variant?: "floating" | "ghost";
};

const SIZES = {
  sm: { btn: "h-8 w-8", icon: "h-4 w-4" },
  md: { btn: "h-10 w-10", icon: "h-5 w-5" },
  lg: { btn: "h-12 w-12", icon: "h-6 w-6" },
};

export function FavoriteButton({ vehicleId, size = "md", className, variant = "floating" }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(vehicleId);
  const [pulse, setPulse] = useState(false);
  const s = SIZES[size];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPulse(true);
    setTimeout(() => setPulse(false), 450);
    toggle(vehicleId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={fav ? "Remover dos favoritos" : "Salvar veículo"}
      aria-pressed={fav}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-150 active:scale-90",
        variant === "floating" &&
          "bg-black/55 backdrop-blur-md border border-white/10 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6)] hover:bg-black/70",
        s.btn,
        className,
      )}
    >
      <Heart
        className={cn(
          s.icon,
          "transition-all duration-200",
          fav ? "fill-rose-500 text-rose-500" : "text-white",
          pulse && "animate-[heart-pop_0.45s_ease-out]",
        )}
        strokeWidth={2.2}
      />
    </button>
  );
}
