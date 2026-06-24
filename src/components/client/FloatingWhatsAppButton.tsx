import { useLocation } from "react-router-dom";
import { useOptionalClientStore } from "@/contexts/ClientStoreContext";
import { onlyDigits } from "@/lib/format";

export function FloatingWhatsAppButton() {
  const location = useLocation();
  const ctx = useOptionalClientStore();
  const whatsapp = ctx?.store?.whatsapp;

  // Não exibe na Academy para não poluir o layout de vídeos/aulas
  if (location.pathname.startsWith("/academy")) return null;
  if (!whatsapp) return null;

  const digits = onlyDigits(whatsapp);
  if (!digits) return null;

  const href = `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed z-50 flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(37,211,102,0.6)] hover:scale-105 transition-transform animate-[wa-pulse_2.6s_ease-in-out_infinite]"
      style={{ top: "50%", right: "16px", transform: "translateY(-50%)" }}
    >
      <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.302.187-.66.187-.99 0-.715-1.95-1.703-2.65-1.703z" />
        <path d="M16.045 0C7.18 0 .25 6.93.25 15.795c0 2.78.747 5.473 2.165 7.852L0 32l8.5-2.226a15.81 15.81 0 0 0 7.545 1.92c8.86 0 15.79-6.93 15.79-15.794S24.905 0 16.045 0zm0 28.91a13.07 13.07 0 0 1-6.7-1.835l-.476-.287-4.97 1.304 1.32-4.84-.31-.5a13.094 13.094 0 0 1-2.005-6.957c0-7.236 5.892-13.13 13.142-13.13s13.115 5.894 13.115 13.13c0 7.235-5.864 13.115-13.115 13.115z" />
      </svg>
      <style>{`@keyframes wa-pulse{0%,100%{box-shadow:0 8px 24px -6px rgba(37,211,102,0.6),0 0 0 0 rgba(37,211,102,0.5)}50%{box-shadow:0 8px 24px -6px rgba(37,211,102,0.6),0 0 0 12px rgba(37,211,102,0)}}`}</style>
    </a>
  );
}
