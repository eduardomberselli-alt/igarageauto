import { useEffect, useState } from "react";
import { Car } from "lucide-react";

const SPLASH_KEY = "garageclub_splash_shown";
const DURATION_MS = 1500;

/**
 * Splash screen mostrada uma vez por sessão na entrada do app:
 * fundo branco limpo + ícone Garage centralizado por 1.5s,
 * antes de revelar o tema escuro do dashboard.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SPLASH_KEY) !== "1";
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fadeTimer = setTimeout(() => setFading(true), DURATION_MS - 350);
    const hideTimer = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, DURATION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-700">
        <Car size={64} className="text-[#D4AF37]" strokeWidth={1.2} />
        <span className="text-xl font-semibold tracking-tight text-[#D4AF37]">
          Garage
        </span>
      </div>
    </div>
  );
}
