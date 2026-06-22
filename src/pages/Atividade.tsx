import { Link } from "react-router-dom";
import { Bell, Flame, TrendingDown, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useActivityFeed, type ActivityItem, type ActivityKind } from "@/hooks/useActivityFeed";
import { formatBRL } from "@/lib/format";

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

const ICONS: Record<ActivityKind, { Icon: typeof Bell; color: string; bg: string }> = {
  hot_vehicle: {
    Icon: Flame,
    color: "text-orange-400",
    bg: "bg-gradient-to-br from-orange-500/25 to-red-600/25 border-orange-500/30",
  },
  price_drop: {
    Icon: TrendingDown,
    color: "text-[#D4AF37]",
    bg: "bg-[#D4AF37]/15 border-[#D4AF37]/30",
  },
  sold: {
    Icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/30",
  },
  many_views: {
    Icon: Eye,
    color: "text-sky-400",
    bg: "bg-sky-500/15 border-sky-500/30",
  },
};

function buildMessage(item: ActivityItem) {
  const titulo = item.vehicleTitulo || item.metadata?.titulo || "Seu veículo";
  switch (item.tipo) {
    case "hot_vehicle":
      return { title: `${titulo} está em alta`, sub: `${item.metadata?.views ?? "+50"} visualizações hoje` };
    case "price_drop": {
      const oldP = Number(item.metadata?.old_price);
      const newP = Number(item.metadata?.new_price);
      return {
        title: `${titulo} baixou de preço`,
        sub:
          Number.isFinite(oldP) && Number.isFinite(newP)
            ? `De ${formatBRL(oldP)} → ${formatBRL(newP)}`
            : "Novo preço atualizado",
      };
    }
    case "sold":
      return { title: `${titulo} foi vendido`, sub: "Parabéns pela conversão 🎉" };
    case "many_views":
      return { title: `${titulo} com muitos acessos`, sub: `${item.metadata?.views ?? "+100"} visualizações hoje` };
  }
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const { Icon, color, bg } = ICONS[item.tipo];
  const { title, sub } = buildMessage(item);

  const inner = (
    <div
      className="rounded-2xl p-4 flex items-start gap-3 border transition-colors hover:border-[#D4AF37]/30 animate-fade-in"
      style={{ backgroundColor: "#141414", borderColor: "#222" }}
    >
      <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 border ${bg}`}>
        <Icon className={`h-5 w-5 ${color}`} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(item.createdAt)}</p>
      </div>
      {item.vehicleFotoUrl && (
        <img
          src={item.vehicleFotoUrl}
          alt=""
          className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
          loading="lazy"
        />
      )}
    </div>
  );

  if (item.vehicleId) {
    return (
      <Link to={`/veiculo/${item.vehicleId}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export default function Atividade() {
  const { items, loading, hasMore, loadingMore, loadMore } = useActivityFeed();

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-center mb-4">
        <Logo size={40} />
      </div>
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Atividade</h1>
        <p className="text-sm text-muted-foreground">Eventos do seu estoque em tempo real.</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Sem novidades</p>
          <p className="text-xs text-muted-foreground mt-1">
            Quando seus veículos receberem visualizações, baixarem de preço ou forem vendidos, os
            eventos aparecem aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id}>
                <ActivityCard item={it} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-5 flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                  </>
                ) : (
                  "Carregar mais"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
