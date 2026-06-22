import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SESSION_KEY = "emly_wa_bubble_shown";

export function WhatsAppChatBubble() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}
    const showTimer = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
    }, 3000);
    const hideTimer = setTimeout(() => setVisible(false), 3000 + 8000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed right-5 z-50 max-w-[240px] animate-[wa-bubble-in_320ms_ease-out]"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 160px)" }}
      role="status"
    >
      <div className="relative rounded-2xl bg-white text-neutral-900 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.35)] px-4 py-3 pr-7 text-sm leading-snug">
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Fechar"
          className="absolute top-1.5 right-1.5 p-1 text-neutral-400 hover:text-neutral-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <p className="font-semibold">👨‍💼 Quer mais informações?</p>
        <p className="mt-1 text-neutral-600 text-[13px]">
          Nossa equipe está pronta para atender você.
        </p>
        <span
          className="absolute -bottom-2 right-6 h-3 w-3 rotate-45 bg-white"
          aria-hidden="true"
        />
      </div>
      <style>{`@keyframes wa-bubble-in{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
