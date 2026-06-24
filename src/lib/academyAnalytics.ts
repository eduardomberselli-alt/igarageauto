// Stubs de analytics da Garage Academy. Substituir por uma integração real
// (ex.: edge function ou tabela `academy_analytics`) no futuro.

type Payload = Record<string, unknown>;

function emit(event: string, payload: Payload) {
  if (typeof window === "undefined") return;
  // Mantém ganchos para um eventual data layer / GA / posthog.
  try {
    // eslint-disable-next-line no-console
    console.debug("[academy]", event, payload);
    (window as any).dispatchEvent(
      new CustomEvent(`academy:${event}`, { detail: payload }),
    );
  } catch {
    /* noop */
  }
}

export const academyAnalytics = {
  videoView: (videoId: string, meta?: Payload) =>
    emit("video_view", { videoId, last_viewed: new Date().toISOString(), ...meta }),
  categoryView: (categoryId: string, meta?: Payload) =>
    emit("category_view", { categoryId, last_viewed: new Date().toISOString(), ...meta }),
  videoDuration: (videoId: string, seconds: number) =>
    emit("video_duration", { videoId, seconds }),
  favoriteVideo: (videoId: string, favorited: boolean) =>
    emit("favorite_video", { videoId, favorited }),
};