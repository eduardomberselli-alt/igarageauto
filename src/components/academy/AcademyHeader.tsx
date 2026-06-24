import { GraduationCap } from "lucide-react";

export function AcademyHeader() {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1208] via-[#0f0f0f] to-[#0a0a0a] p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#D4AF37]/15 blur-3xl"
      />
      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
          <GraduationCap className="h-3.5 w-3.5" /> Garage Academy
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
          🎓 Garage Academy
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-white/85">
          Compre e venda veículos com mais confiança.
        </p>
        <p className="mt-1 text-xs text-white/55 leading-relaxed">
          Vídeos e conteúdos para ajudar você a fazer um bom negócio e evitar prejuízos.
        </p>
      </div>
    </header>
  );
}