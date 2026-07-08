import { useEffect, useMemo, useState } from "react";
import { BarChart3, Eye, Link as LinkIcon, MousePointerClick } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminView } from "@/contexts/AdminViewContext";

type Row = {
  id: string;
  vehicle_id: string;
  original_url: string;
  tracking_code: string;
  accessed_at: string | null;
  ip_hash: string | null;
  created_at: string;
};

type VehicleInfo = { id: string; titulo: string };

export default function Metricas() {
  const { user } = useAuth();
  const { effectiveUserId } = useAdminView();
  const lojistaId = effectiveUserId ?? user?.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, VehicleInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojistaId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("share_tracking" as never)
        .select("id, vehicle_id, original_url, tracking_code, accessed_at, ip_hash, created_at")
        .eq("lojista_id", lojistaId)
        .order("created_at", { ascending: false });

      const list = (data as Row[]) ?? [];
      const ids = Array.from(new Set(list.map((r) => r.vehicle_id)));
      let vMap: Record<string, VehicleInfo> = {};
      if (ids.length) {
        const { data: vs } = await supabase
          .from("properties")
          .select("id, titulo")
          .in("id", ids);
        vMap = Object.fromEntries(((vs as VehicleInfo[]) ?? []).map((v) => [v.id, v]));
      }
      if (!cancelled) {
        setRows(list);
        setVehicles(vMap);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lojistaId]);

  const linksGerados = rows.filter((r) => !r.accessed_at).length;
  const totalAcessos = rows.filter((r) => !!r.accessed_at).length;
  const acessosUnicos = useMemo(
    () =>
      new Set(
        rows.filter((r) => r.accessed_at && r.ip_hash).map((r) => r.ip_hash as string),
      ).size,
    [rows],
  );

  const topVeiculos = useMemo(() => {
    const agg = new Map<
      string,
      { total: number; links: number; unicosSet: Set<string> }
    >();
    rows.forEach((r) => {
      const cur =
        agg.get(r.vehicle_id) ?? { total: 0, links: 0, unicosSet: new Set<string>() };
      cur.links += 1;
      if (r.accessed_at) {
        cur.total += 1;
        if (r.ip_hash) cur.unicosSet.add(r.ip_hash);
      }
      agg.set(r.vehicle_id, cur);
    });
    return Array.from(agg.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([vehicle_id, v]) => ({
        vehicle_id,
        titulo: vehicles[vehicle_id]?.titulo ?? "Veículo",
        total: v.total,
        links: v.links,
        unicos: v.unicosSet.size,
      }));
  }, [rows, vehicles]);

  const acessosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    rows.forEach((r) => {
      if (!r.accessed_at) return;
      const key = r.accessed_at.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([date, total]) => ({
      dia: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total,
    }));
  }, [rows]);

  return (
    <div className="px-4 py-6 pb-24 max-w-[480px] mx-auto">
      <header className="flex items-center gap-2 mb-5">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-extrabold tracking-tight">Métricas de compartilhamento</h1>
      </header>

      <section className="grid grid-cols-3 gap-2 mb-6">
        <Card icon={<LinkIcon className="h-4 w-4" />} label="Links" value={linksGerados} />
        <Card icon={<Eye className="h-4 w-4" />} label="Acessos" value={totalAcessos} />
        <Card icon={<MousePointerClick className="h-4 w-4" />} label="Únicos" value={acessosUnicos} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Acessos nos últimos 7 dias
        </h2>
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={acessosPorDia}>
              <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Top 5 veículos mais acessados
        </h2>
        {topVeiculos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum acesso registrado ainda.</p>
        ) : (
          <ul>
            {topVeiculos.map((v, i) => (
              <li
                key={v.vehicle_id}
                className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0"
              >
                <span className="text-sm font-medium truncate pr-2 flex-1">
                  {i + 1}. {v.titulo}
                </span>
                <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
                  <span className="flex flex-col items-end">
                    <span className="text-muted-foreground uppercase tracking-wider">Links</span>
                    <span className="text-foreground text-sm">{v.links}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-muted-foreground uppercase tracking-wider">Únicos</span>
                    <span className="text-foreground text-sm">{v.unicos}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-muted-foreground uppercase tracking-wider">Acessos</span>
                    <span className="text-primary text-sm">{v.total}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {!loading && rows.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum link gerado ainda. Use o botão Compartilhar em um veículo para começar a rastrear.
          </p>
        </div>
      )}
    </div>
  );
}

function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-xl font-extrabold mt-1 text-primary">{value}</p>
    </div>
  );
}
