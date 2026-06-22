/**
 * useBrandColors — NO-OP intencional.
 *
 * O app agora usa uma paleta única e global (Premium Black & Gold) definida
 * em `src/index.css`. Qualquer cor por lojista no banco (brand_primary_color /
 * brand_accent_color) é IGNORADA no front para garantir consistência visual.
 *
 * Mantemos a assinatura para não quebrar imports existentes.
 */

const FIXED_PRIMARY = "#D4AF37";
const FIXED_ACCENT = "#D4AF37";

export function detectStoreTheme(_primary?: string | null, _accent?: string | null) {
  return "premium_dark" as const;
}

export function useBrandColors(
  _primary?: string | null,
  _accent?: string | null,
  _options?: { applyTheme?: boolean },
) {
  // Garante que as variáveis de marca sempre apontem para o dourado oficial.
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", FIXED_PRIMARY);
    root.style.setProperty("--brand-accent", FIXED_ACCENT);
    // Remove qualquer tema de loja antigo que possa ter sido aplicado.
    if (root.getAttribute("data-store-theme")) {
      root.removeAttribute("data-store-theme");
    }
  }
}
