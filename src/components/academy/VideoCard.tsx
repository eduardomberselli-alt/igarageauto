import { Play } from "lucide-react";
import { extractYoutubeId, ytThumb } from "@/lib/youtube";
import type { AcademyVideo } from "@/data/academyData";

function getThumb(v: AcademyVideo): string | null {
  if (v.thumbnail) return v.thumbnail;
  const id = extractYoutubeId(v.videoUrl);
  return id ? ytThumb(id) : null;
}

export function VideoCard({
  video,
  onPlay,
}: {
  video: AcademyVideo;
  onPlay: (v: AcademyVideo) => void;
}) {
  const thumb = getThumb(video);
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group text-left rounded-2xl overflow-hidden bg-[#121212] border border-white/5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)] transition hover:border-[#D4AF37]/40 hover:shadow-[0_12px_32px_-12px_rgba(212,175,55,0.25)]"
    >
      <div className="relative aspect-video bg-black/60">
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-lg transition group-hover:scale-110">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </span>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
          {video.title}
        </h3>
        {video.description && (
          <p className="mt-1 text-xs text-white/60 line-clamp-2">{video.description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-3 py-1 text-[11px] font-bold text-black">
          Assistir
        </span>
      </div>
    </button>
  );
}