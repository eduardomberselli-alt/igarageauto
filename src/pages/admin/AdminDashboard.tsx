import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Car, Inbox, CheckCircle2, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Stats = {
  lojas: number;
  lojasAtivas: number;
  veiculos: number;
  veiculosVendidos: number;
  leads: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [lojas, ativas, veiculos, vendidos, leads] = await Promise.all([
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("user_id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("vendido", true),
        supabase.from("leads").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        lojas: lojas.count ?? 0,
        lojasAtivas: ativas.count ?? 0,
        veiculos: veiculos.count ?? 0,
        veiculosVendidos: vendidos.count ?? 0,
        leads: leads.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Total de lojas", value: stats?.lojas, icon: Store, to: "/admin/lojas" },
    { label: "Lojas ativas", value: stats?.lojasAtivas, icon: Activity, to: "/admin/lojas" },
    { label: "Veículos", value: stats?.veiculos, icon: Car, to: "/admin/lojas" },
    { label: "Vendidos", value: stats?.veiculosVendidos, icon: CheckCircle2, to: "/admin/lojas" },
    { label: "Leads", value: stats?.leads, icon: Inbox, to: "/admin/leads" },
  ];

  return (
    <div className="px-4 pt-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <p className="text-xs text-muted-foreground">Visão geral do Garage</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-2xl bg-card border border-border p-4 shadow-[var(--shadow-card)] hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            {stats === null ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold text-primary">{value}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
