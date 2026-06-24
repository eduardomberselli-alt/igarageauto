import { useNavigate } from "react-router-dom";
import { ShieldCheck, GraduationCap } from "lucide-react";

export function AcademyHomeCard() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/academy")}
      className="group relative w-full text-left overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#1a1208] via-[#121212] to-[#0a0a0a] p-4 mb-4 transition hover:border-[#D4AF37]/50"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D4AF37]/15 blur-2xl"
      />
      <div className="relative flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
            <GraduationCap className="h-3 w-3" /> Garage Academy
          </div>
          <h3 className="mt-1 text-sm font-extrabold text-white leading-tight">
            🛡️ Compre com mais confiança
          </h3>
          <p className="mt-1 text-xs text-white/60 leading-snug">
            Conheça a Garage Academy e aprenda como evitar golpes e fazer um bom negócio.
          </p>
          <span className="mt-3 inline-flex items-center rounded-full bg-[#D4AF37] px-3 py-1 text-[11px] font-bold text-black transition group-hover:brightness-110">
            Explorar Academy
          </span>
        </div>
      </div>
    </button>
  );
}