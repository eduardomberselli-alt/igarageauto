import { useEffect, useState } from "react";
import { Heart, RotateCcw, Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_PALETTES, DEFAULT_BRAND_ACCENT, DEFAULT_BRAND_PRIMARY } from "@/types";

type Props = {
  initialPrimary: string;
  initialAccent: string;
  saving?: boolean;
  onSave: (primary: string, accent: string) => Promise<void> | void;
};

export function BrandColorsSection({ initialPrimary, initialAccent, saving, onSave }: Props) {
  const [primary, setPrimary] = useState(initialPrimary || DEFAULT_BRAND_PRIMARY);
  const [accent, setAccent] = useState(initialAccent || DEFAULT_BRAND_ACCENT);

  useEffect(() => {
    setPrimary(initialPrimary || DEFAULT_BRAND_PRIMARY);
    setAccent(initialAccent || DEFAULT_BRAND_ACCENT);
  }, [initialPrimary, initialAccent]);

  // Preview ao vivo: aplica imediatamente as cores escolhidas no app inteiro
  // (sobrescreve --brand-primary / --brand-accent no <html>) enquanto o
  // corretor experimenta paletas, antes mesmo de salvar.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", primary);
    root.style.setProperty("--brand-accent", accent);
  }, [primary, accent]);

  const reset = () => {
    setPrimary(DEFAULT_BRAND_PRIMARY);
    setAccent(DEFAULT_BRAND_ACCENT);
  };

  const apply = (p: string, a: string) => {
    setPrimary(p);
    setAccent(a);
  };

  const isCurrentPalette = (p: string, a: string) =>
    p.toLowerCase() === primary.toLowerCase() && a.toLowerCase() === accent.toLowerCase();

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-5">
      <div className="flex items-start gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Palette className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">🎨 Identidade Visual Profissional</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Suas cores aparecem no seu portfólio público e nas páginas dos seus veículos.
          </p>
        </div>
      </div>

      {/* Paletas pré-definidas */}
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Paletas sugeridas
        </Label>
        <div className="grid grid-cols-3 gap-2.5 mt-2 sm:grid-cols-6">
          {BRAND_PALETTES.map((pal) => {
            const active = isCurrentPalette(pal.primary, pal.accent);
            return (
              <button
                key={pal.key}
                type="button"
                onClick={() => apply(pal.primary, pal.accent)}
                className={`group flex flex-col items-center gap-1.5 rounded-xl p-2 border transition-all ${
                  active
                    ? "border-primary bg-primary/10 shadow-[var(--shadow-card)]"
                    : "border-border hover:border-primary/50"
                }`}
                aria-label={`Paleta ${pal.label}`}
              >
                <div className="relative h-9 w-9">
                  <span
                    className="absolute inset-0 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: pal.primary }}
                  />
                  <span
                    className="absolute right-0 bottom-0 h-5 w-5 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: pal.accent }}
                  />
                </div>
                <span className="text-[10px] font-medium text-foreground/80">{pal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor personalizado */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Cor principal</Label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-none bg-transparent p-0"
              aria-label="Selecionar cor principal"
            />
            <Input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-8 border-0 bg-transparent px-1 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
              maxLength={7}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Cor de destaque</Label>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border-none bg-transparent p-0"
              aria-label="Selecionar cor de destaque"
            />
            <Input
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-8 border-0 bg-transparent px-1 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Preview ao vivo */}
      <div>
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Pré-visualização
        </Label>
        <div
          className="mt-2 rounded-2xl overflow-hidden border-2 bg-card shadow-[var(--shadow-card)]"
          style={{ borderColor: accent }}
        >
          <div
            className="h-24 w-full"
            style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
            }}
          />
          <div className="p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold leading-tight text-sm">
                  Cobertura Jardins — 300m²
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Bairro nobre · 4 suítes
                </p>
              </div>
              <Heart
                className="h-5 w-5 shrink-0 fill-current"
                style={{ color: accent }}
                aria-hidden
              />
            </div>
            <p className="text-lg font-bold" style={{ color: primary }}>
              R$ 2.500.000
            </p>
            <button
              type="button"
              className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary }}
            >
              Solicitar visita
            </button>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="button" variant="outline" onClick={reset} disabled={saving}>
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
        <Button type="button" onClick={() => onSave(primary, accent)} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Salvando…" : "Salvar cores"}
        </Button>
      </div>
    </section>
  );
}
