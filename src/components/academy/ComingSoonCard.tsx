import type { AcademyCategory } from "@/data/academyData";

export function ComingSoonCard({ category }: { category: AcademyCategory }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#121212] p-4 opacity-90">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none" aria-hidden>
            {category.icon}
          </span>
          <h3 className="text-sm font-bold text-white">{category.name}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
          Em breve
        </span>
      </div>
      <p className="mt-2 text-xs text-white/55 leading-relaxed">{category.description}</p>
    </div>
  );
}