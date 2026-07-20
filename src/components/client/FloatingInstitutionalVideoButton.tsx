import { useLocation } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { useOptionalClientStore } from "@/contexts/ClientStoreContext";

function isAllowed(pathname: string) {
  if (
    pathname.startsWith("/veiculo/") ||
    pathname.startsWith("/imovel/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/v/")
  )
    return true;
  if (/^\/[^/]+\/[^/]+$/.test(pathname) && !pathname.startsWith("/loja/")) return true;
  if (pathname.startsWith("/loja/") && pathname.endsWith("/vitrine")) return true;
  if (pathname.startsWith("/loja/") && pathname.endsWith("/sobre")) return true;
  if (/^\/p\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function FloatingInstitutionalVideoButton() {
  const location = useLocation();
  const ctx = useOptionalClientStore();
  const url = ctx?.store?.videoInstitucionalUrl;

  if (!isAllowed(location.pathname)) return null;
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Vídeo Institucional da loja"
      className="fixed z-50 flex items-center gap-1.5 pl-2.5 pr-3 h-9 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 164px)",
        right: "16px",
      }}
    >
      <PlayCircle className="h-5 w-5" />
      <span className="text-xs font-semibold whitespace-nowrap">Conheça nossa Loja</span>
    </a>
  );
}