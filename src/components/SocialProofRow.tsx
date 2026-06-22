import { Trophy, Zap, Users } from "lucide-react";

type Props = {
  soldCount: number;
  interestedToday: number;
  /** Texto curto exibido no badge "Responde rápido" (ex.: "~10min") */
  responseLabel?: string;
};

export function SocialProofRow({ soldCount, interestedToday, responseLabel = "~10min" }: Props) {
  const cards = [
    {
      icon: <Trophy className="h-4 w-4" />,
      value: soldCount,
      label: soldCount === 1 ? "veículo vendido" : "veículos vendidos",
      accent: "text-[hsl(var(--gold))]",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      value: responseLabel,
      label: "Responde rápido",
      accent: "text-emerald-400",
    },
    {
      icon: <Users className="h-4 w-4" />,
      value: interestedToday,
      label: interestedToday === 1 ? "interessado hoje" : "interessados hoje",
      accent: "text-sky-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl bg-[#141414] border border-white/5 p-3 flex flex-col items-start gap-1"
        >
          <div className={`flex items-center gap-1.5 ${c.accent}`}>
            {c.icon}
            <span className="text-base font-bold leading-none">{c.value}</span>
          </div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}
