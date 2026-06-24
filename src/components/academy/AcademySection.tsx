import { useEffect } from "react";
import { VideoCard } from "./VideoCard";
import { academyAnalytics } from "@/lib/academyAnalytics";
import type { AcademyCategory, AcademyVideo } from "@/data/academyData";

export function AcademySection({
  category,
  videos,
  onPlay,
}: {
  category: AcademyCategory;
  videos: AcademyVideo[];
  onPlay: (v: AcademyVideo) => void;
}) {
  useEffect(() => {
    academyAnalytics.categoryView(category.id);
  }, [category.id]);

  return (
    <section className="mt-7">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl" aria-hidden>{category.icon}</span>
        <h2 className="text-lg font-extrabold tracking-tight text-white">
          {category.name}
        </h2>
      </div>
      <p className="text-xs text-white/55 mb-4 leading-relaxed">{category.description}</p>
      {videos.length === 0 ? (
        <p className="text-xs text-white/40">Nenhum conteúdo disponível.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onPlay={onPlay} />
          ))}
        </div>
      )}
    </section>
  );
}