import { useMemo, useState } from "react";
import { PlayCircle, BookOpen } from "lucide-react";
import { ytEmbed, ytThumb } from "@/lib/youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { LEARNING_CATEGORIES, type LearningAudience, type LearningCategory, type LearningContent } from "@/types";

type Props = {
  items: LearningContent[];
  loading: boolean;
  audience: LearningAudience;
};

export function ConhecimentoView({ items, loading, audience }: Props) {
  const categories = useMemo(
    () =>
      audience === "publico"
        ? LEARNING_CATEGORIES.filter((c) => c.key !== "tecnica_vendas")
        : LEARNING_CATEGORIES,
    [audience],
  );

  const [activeCat, setActiveCat] = useState<LearningCategory>(categories[0].key);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((i) => i.categoria === activeCat),
    [items, activeCat],
  );

  return (
    <div className="px-4 mt-4 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Central de Conhecimento
        </h2>
      </div>

      {/* Filtro por categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              setActiveCat(c.key);
              setActiveVideo(null);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
              activeCat === c.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          Nenhum conteúdo nesta categoria ainda.
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((v) => (
          <article
            key={v.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
          >
            <div className="aspect-video bg-muted relative">
              {activeVideo === v.id ? (
                <iframe
                  src={ytEmbed(v.youtubeId)}
                  title={v.titulo}
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveVideo(v.id)}
                  className="group relative h-full w-full"
                >
                  <img
                    src={ytThumb(v.youtubeId)}
                    alt={v.titulo}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
                  </div>
                </button>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold leading-tight">{v.titulo}</h3>
              {v.descricao && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {v.descricao}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
