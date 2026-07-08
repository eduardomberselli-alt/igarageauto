import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Trash2, MapPin, CheckCircle2, Circle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCard } from "@/components/SkeletonCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAulas, useProfile, useProperties } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { useAdminView } from "@/contexts/AdminViewContext";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

import { PropertyForm, type PropertyFormValues } from "@/components/PropertyForm";
import { VehicleStatusBadges } from "@/components/VehicleStatusBadges";
import { FavoriteButton } from "@/components/FavoriteButton";
import { vehicleUrl } from "@/lib/vehicleUrl";
import { PortfolioFilters, applyFilters, emptyFilters, type Filters } from "@/components/PortfolioFilters";
import type { Property } from "@/types";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Dashboard() {
  const { viewingStoreId, effectiveUserId } = useAdminView();
  const { profile } = useProfile(effectiveUserId);
  const { properties, loading, create, update, remove } = useProperties({ ownerId: viewingStoreId ?? undefined });
  const { complete } = useAulas();
  const { isAdmin, signOut } = useAuth();
  const [editing, setEditing] = useState<Property | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Property | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const filtered = applyFilters(properties, filters);

  // Permite que o botão "+" da BottomNav abra o formulário de novo veículo
  useEffect(() => {
    const onNew = () => {
      setEditing(null);
      setOpen(true);
    };
    window.addEventListener("app:new-property", onNew);
    return () => window.removeEventListener("app:new-property", onNew);
  }, []);

  const handleGenerate = async (p: Property) => {
    // Debounce: evita cliques repetidos abrindo múltiplas abas no Safari iOS.
    if (generatingId === p.id) return;
    setGeneratingId(p.id);

    const originalUrl = vehicleUrl(p, profile?.slug);

    // Safari iOS exige que window.open seja chamado SINCRONAMENTE dentro do
    // handler de clique (mesmo tick, sem await antes). Também escreve uma
    // tela de "carregando" para dar feedback em redes lentas.
    const isStandalone =
      // iOS PWA instalado
      (typeof navigator !== "undefined" && (navigator as any).standalone === true) ||
      (typeof window !== "undefined" &&
        window.matchMedia?.("(display-mode: standalone)").matches);

    // Em PWA instalado no iOS, window.open costuma ser bloqueado / retornar null.
    // Nesse caso navegamos na própria aba usando location.href (também dentro do gesto).
    const newTab = isStandalone ? null : window.open("about:blank", "_blank");
    if (newTab) {
      try {
        newTab.document.write(
          '<!doctype html><meta charset="utf-8"><title>Abrindo…</title>' +
            '<style>html,body{height:100%;margin:0;background:#0b0b0b;color:#fff;' +
            'font-family:-apple-system,system-ui,sans-serif;display:flex;' +
            'align-items:center;justify-content:center}</style>' +
            "<div>Abrindo página do veículo…</div>",
        );
        newTab.document.close();
      } catch {
        /* alguns navegadores bloqueiam document.write em about:blank */
      }
    }

    const navigateTo = (url: string) => {
      if (newTab && !newTab.closed) {
        try {
          newTab.location.replace(url);
          return;
        } catch {
          /* fallthrough */
        }
      }
      // Sem aba nova (PWA / pop-up bloqueado): navega na própria aba.
      window.location.href = url;
    };

    try {
      const { data, error } = await supabase.functions.invoke("generate-share-link", {
        body: { vehicle_id: p.id, original_url: originalUrl },
      });
      if (error || !data?.tracking_link) throw error ?? new Error("Falha ao gerar link");
      const trackingLink = data.tracking_link as string;
      await navigator.clipboard.writeText(trackingLink).catch(() => {});
      toast.success("Link rastreável copiado!", {
        description: "Agora você sabe quantas pessoas abriram.",
      });
      navigateTo(`${trackingLink}${trackingLink.includes("?") ? "&" : "?"}preview=1`);
    } catch {
      await navigator.clipboard.writeText(originalUrl).catch(() => {});
      toast.error("Não foi possível gerar link rastreável", {
        description: "Link normal copiado como alternativa.",
      });
      navigateTo(originalUrl);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSave = async (values: PropertyFormValues, id?: string) => {
    const err = id ? await update(id, values) : await create(values, viewingStoreId ?? undefined);
    if (err) toast.error(err.message);
    else toast.success(id ? "Veículo atualizado" : "Veículo criado");
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const err = await remove(toDelete.id);
    if (err) toast.error(err.message);
    else toast.success("Veículo removido");
    setToDelete(null);
  };

  const toggleVendido = async (p: Property) => {
    const err = await update(p.id, { vendido: !p.vendido });
    if (!err) toast.success(!p.vendido ? "Marcado como Vendido" : "Vendido removido");
  };

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Branding bar — logo Garage */}
      <div className="flex items-center justify-center mb-4">
        <Logo size={40} />
      </div>

      <header className="flex items-center gap-3 mb-6">
        <img
          src={profile?.fotoUrl || "/placeholder.svg"}
          alt={profile?.nome || ""}
          className="h-12 w-12 rounded-full object-cover bg-muted"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Olá,</p>
          <h1 className="text-lg font-semibold truncate">{profile?.nome || "Lojista"}</h1>
        </div>
        {isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Minha Vitrine
        </h2>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          Novo
        </Button>
      </div>

      <PortfolioFilters
        filters={filters}
        onChange={setFilters}
        properties={properties}
      />

      <div className="space-y-4">
        {loading &&
          [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

        {!loading && properties.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum veículo ainda. Toque em "Novo" para cadastrar seu primeiro carro.
          </div>
        )}

        {!loading && properties.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum veículo encontrado com esses critérios.
          </div>
        )}

        {!loading &&
          filtered.map((p) => {
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {p.fotoUrl && (
                    <img
                      src={p.fotoUrl}
                      alt={p.titulo}
                      className={`h-full w-full object-cover ${p.vendido ? "grayscale-[40%]" : ""}`}
                      loading="lazy"
                    />
                  )}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <FavoriteButton vehicleId={p.id} size="sm" />
                  </div>
                  <VehicleStatusBadges property={p} max={2} />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold leading-tight">{p.titulo}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {p.bairro}
                    </p>
                  </div>
                  {p.vendido ? (
                    <p className="text-base font-semibold text-primary">Vendido e Entregue</p>
                  ) : (
                    <p className="text-xl font-bold text-primary">{formatBRL(p.preco)}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {p.videos.length} vídeo{p.videos.length === 1 ? "" : "s"} vinculado
                    {p.videos.length === 1 ? "" : "s"}
                  </div>

                  <button
                    onClick={() => toggleVendido(p)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    {p.vendido ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                    {p.vendido ? "Vendido" : "Marcar como vendido"}
                  </button>
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1"
                      onClick={() => handleGenerate(p)}
                      disabled={generatingId === p.id}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {generatingId === p.id ? "Abrindo…" : "Página do veículo"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setEditing(p); setOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setToDelete(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>

      <PropertyForm
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. "{toDelete?.titulo}" será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
