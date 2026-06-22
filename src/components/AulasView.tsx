import { useMemo } from "react";
import { CheckCircle2, Circle, GraduationCap, Trophy, PlayCircle, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAulas } from "@/hooks/useAppData";
import { ytThumb } from "@/lib/youtube";

/**
 * Visualização de Aulas (antigo EAD).
 * Reutilizada dentro da aba Conhecimento.
 */
export function AulasView() {
  const { aulas, loading, progress, toggle, total, done, percent, complete } = useAulas();

  const sorted = useMemo(() => [...aulas].sort((a, b) => a.ordem - b.ordem), [aulas]);

  return (
    <div className="space-y-5">
      {/* Progress card */}
      {!loading && total > 0 && (
        <section
          className={`rounded-2xl border p-4 shadow-[var(--shadow-card)] ${
            complete
              ? "border-[hsl(var(--gold))]/50 bg-gradient-to-br from-[hsl(var(--gold))]/15 to-[hsl(var(--rose-gold))]/10"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progresso global
            </p>
            <p className="text-xs font-bold">
              {done} / {total}
            </p>
          </div>
          <Progress value={percent} className="h-2.5" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold">{percent}%</p>
            {complete ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))] text-xs font-bold px-3 py-1.5 border border-[hsl(var(--gold))]/40">
                <Trophy className="h-3.5 w-3.5" />
                Especialista Técnico
              </span>
            ) : (
              <p className="text-[11px] text-muted-foreground text-right">
                Faltam <strong className="text-foreground">{total - done}</strong>{" "}
                aula{total - done === 1 ? "" : "s"} para o selo
              </p>
            )}
          </div>

          {complete && (
            <div className="mt-3 pt-3 border-t border-[hsl(var(--gold))]/20 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--gold))] shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/90">
                Você concluiu o EAD completo. O selo <strong>Especialista Técnico</strong> agora
                aparece no seu portfólio público e contribui para o nível Ouro de autoridade.
              </p>
            </div>
          )}
        </section>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold">Nenhuma aula disponível ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aguarde — a equipe está preparando o conteúdo.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((a, idx) => {
          const isDone = progress.has(a.id);
          return (
            <article
              key={a.id}
              className={`rounded-2xl border p-3 transition-all ${
                isDone
                  ? "border-[hsl(var(--rose-gold))]/40 bg-[hsl(var(--rose-gold))]/5"
                  : "border-border bg-card"
              } shadow-[var(--shadow-card)]`}
            >
              <div className="flex items-start gap-3">
                <a
                  href={`https://youtu.be/${a.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-16 w-24 rounded-lg overflow-hidden bg-muted shrink-0 group"
                >
                  <img
                    src={ytThumb(a.youtubeId)}
                    alt=""
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <PlayCircle className="h-6 w-6 text-white drop-shadow-lg" />
                  </div>
                </a>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      AULA {String(idx + 1).padStart(2, "0")}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-[hsl(var(--rose-gold))]">
                        ✓ CONCLUÍDA
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm leading-tight mt-0.5">{a.titulo}</p>
                  {a.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.descricao}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggle(a.id)}
                className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors border ${
                  isDone
                    ? "bg-[hsl(var(--rose-gold))]/15 text-[hsl(var(--rose-gold))] border-[hsl(var(--rose-gold))]/40 hover:bg-[hsl(var(--rose-gold))]/25"
                    : "bg-secondary text-foreground border-border hover:bg-muted"
                }`}
                aria-pressed={isDone}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Concluída — desmarcar
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4" />
                    Marcar como concluída
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
