import { getVimeoId, getYouTubeId, isDirectVideoUrl, isVimeoUrl } from "./VideoPlayer";

export default function PlayerFrame({ url, title }: { url: string; title: string }) {
  if (isDirectVideoUrl(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        className="h-full w-full bg-black"
        preload="metadata"
      />
    );
  }

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    );
  }

  if (isVimeoUrl(url)) {
    const id = getVimeoId(url);
    if (id) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${id}?autoplay=1`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      );
    }
  }

  return (
    <iframe
      src={url}
      title={title}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      className="h-full w-full"
    />
  );
}