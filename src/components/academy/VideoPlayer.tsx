import { lazy, Suspense, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { extractYoutubeId } from "@/lib/youtube";
import { academyAnalytics } from "@/lib/academyAnalytics";
import type { AcademyVideo } from "@/data/academyData";

const PlayerFrame = lazy(() => import("./PlayerFrame"));

export function VideoPlayer({
  video,
  open,
  onClose,
}: {
  video: AcademyVideo | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open && video) academyAnalytics.videoView(video.id);
  }, [open, video]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl w-[96vw] sm:w-[92vw] p-0 gap-0 border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <DialogTitle className="text-sm font-semibold text-white truncate">
            {video?.title ?? ""}
          </DialogTitle>
        </div>
        <div className="aspect-video w-full bg-black">
          {open && video ? (
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-white/5" />}> 
              <PlayerFrame url={video.videoUrl} title={video.title} />
            </Suspense>
          ) : null}
        </div>
        {video?.description && (
          <p className="px-4 py-3 text-sm text-white/70">{video.description}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogv|m3u8|mov)(\?|$)/i.test(url);
}

export function isVimeoUrl(url: string) {
  return /vimeo\.com/i.test(url);
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function getYouTubeId(url: string): string | null {
  return extractYoutubeId(url);
}