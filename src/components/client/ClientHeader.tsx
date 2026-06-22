import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useClientStore } from "@/contexts/ClientStoreContext";
import { ClientSocialLinks } from "./ClientSocialLinks";
import { StoreLogo } from "./StoreLogo";

type Props = {
  /** Mostrar botão de voltar */
  showBack?: boolean;
  /** Caminho customizado para voltar; padrão = vitrine da loja atual */
  backTo?: string;
  /** Esconder branding da loja (útil quando o conteúdo já mostra) */
  compact?: boolean;
};

export function ClientHeader({ showBack, backTo, compact }: Props) {
  const { store } = useClientStore();
  const navigate = useNavigate();

  const backHref = backTo ?? (store?.slug ? `/loja/${store.slug}/vitrine` : "/");

  return (
    <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/5">
      <div className="h-14 px-3 flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(backHref))}
            aria-label="Voltar"
            className="h-9 w-9 -ml-1 rounded-full flex items-center justify-center text-white/80 hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-1" />
        )}

        {!compact && store && (
          <Link
            to={store.slug ? `/loja/${store.slug}/sobre` : "#"}
            className="flex items-center gap-2.5 min-w-0 flex-1"
          >
            <StoreLogo
              src={store.fotoUrl}
              alt={store.nome}
              className="h-9 w-9 ring-1 ring-[hsl(var(--primary))]/40"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{store.nome}</p>
            </div>
          </Link>
        )}

        {compact && <div className="flex-1" />}

        <ClientSocialLinks profile={store} className="ml-auto pr-1" />
      </div>
    </header>
  );
}
