import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const title = document.title || "Confira este veículo";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Dá uma olhada neste veículo!",
          url: currentUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await fallbackCopy(currentUrl);
        }
      }
    } else {
      await fallbackCopy(currentUrl);
    }
  };

  const fallbackCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // último recurso
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Compartilhar"
      className="h-10 w-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 text-[#D4AF37] hover:bg-white/10 transition-colors"
    >
      {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
    </button>
  );
}
