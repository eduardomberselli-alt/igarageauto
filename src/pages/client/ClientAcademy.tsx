import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SeoTags } from "@/components/SeoTags";
import { AcademyHeader } from "@/components/academy/AcademyHeader";
import { AcademySection } from "@/components/academy/AcademySection";
import { ComingSoonCard } from "@/components/academy/ComingSoonCard";
import { VideoPlayer } from "@/components/academy/VideoPlayer";
import {
  useAcademyCategories,
  useAcademyVideos,
  getCategoryBySlug,
  getVideoById,
  type AcademyVideo,
} from "@/data/academyData";

export default function ClientAcademy() {
  const { category: categorySlug, id: videoId } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState<AcademyVideo | null>(null);
  const categories = useAcademyCategories();
  const videos = useAcademyVideos();

  const filterCategory = categorySlug ? getCategoryBySlug(categorySlug) : null;

  const sections = useMemo(() => {
    const active = categories
      .filter((c) => c.status === "active")
      .filter((c) => (filterCategory ? c.id === filterCategory.id : true))
      .sort((a, b) => a.order - b.order);
    const coming = categories
      .filter((c) => c.status === "coming_soon")
      .filter((c) => (filterCategory ? c.id === filterCategory.id : true))
      .sort((a, b) => a.order - b.order);
    return { active, coming };
  }, [categories, filterCategory]);

  const videosByCategory = (id: string) =>
    videos
      .filter((v) => v.category_id === id && v.status === "published")
      .sort((a, b) => a.order - b.order);

  // Suporte a /academy/video/:id — abre o player diretamente.
  useEffect(() => {
    if (videoId) {
      const v = getVideoById(videoId);
      if (v) setActive(v);
    }
  }, [videoId]);

  const closePlayer = () => {
    setActive(null);
    if (videoId) navigate("/academy", { replace: true });
  };

  return (
    <>
      <SeoTags
        title="Garage Academy"
        description="Compre e venda veículos com mais confiança. Conteúdos para evitar golpes e fazer bons negócios."
      />
      <main className="px-4 pt-4 pb-10 max-w-[480px] mx-auto">
        {filterCategory && (
          <button
            type="button"
            onClick={() => navigate("/academy")}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Todas as categorias
          </button>
        )}

        <AcademyHeader />

        {sections.active.map((cat) => (
          <AcademySection
            key={cat.id}
            category={cat}
            videos={videosByCategory(cat.id)}
            onPlay={setActive}
          />
        ))}

        {sections.coming.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white/50 mb-3">
              Em breve
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              {sections.coming.map((c) => (
                <ComingSoonCard key={c.id} category={c} />
              ))}
            </div>
          </section>
        )}
      </main>

      <VideoPlayer video={active} open={!!active} onClose={closePlayer} />
    </>
  );
}