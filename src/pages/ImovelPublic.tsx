import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  BadgeCheck,
  Store,
  ShieldCheck,
  RefreshCw,
  Calculator,
  Car,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Calendar,
  Gauge,
  Eye,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyMap } from "@/components/PropertyMap";
import { VehicleStatusBadges } from "@/components/VehicleStatusBadges";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ClientSocialLinks } from "@/components/client/ClientSocialLinks";
import { StoreLogo } from "@/components/client/StoreLogo";
import { PhotoLightbox } from "@/components/client/PhotoLightbox";
import { FinancingModal } from "@/components/client/FinancingModal";

import { usePublicProperty, usePublicPropertyBySlug, registerLead } from "@/hooks/useAppData";
import { vehiclePath, vehicleUrl } from "@/lib/vehicleUrl";
import { ensureVehicleCard } from "@/lib/vehicleCard";
import { useBrandColors } from "@/hooks/useBrandColors";
import { useOptionalClientStore } from "@/contexts/ClientStoreContext";
import { useUserMode } from "@/hooks/useUserMode";
import { supabase } from "@/integrations/supabase/client";
import { SeoTags } from "@/components/SeoTags";
import { formatBRL } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

export default function ImovelPublic() {
  const params = useParams();
  const isSlugRoute = !!(params.lojaSlug && params.veiculoSlug);
  const bySlug = usePublicPropertyBySlug(
    isSlugRoute ? params.lojaSlug : undefined,
    isSlugRoute ? params.veiculoSlug : undefined,
  );
  const byId = usePublicProperty(!isSlugRoute ? params.id : undefined);
  const { property, ownerProfile, loading } = isSlugRoute ? bySlug : byId;
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [financingOpen, setFinancingOpen] = useState(false);
  const clientStoreCtx = useOptionalClientStore();
  const { isAdminMode, isClientMode } = useUserMode(property?.ownerId);


  useEffect(() => {
    setActivePhoto(0);
  }, [property?.id]);

  // Sincroniza loja no contexto do cliente (quando renderizado dentro do ClientLayout)
  useEffect(() => {
    if (clientStoreCtx && ownerProfile) {
      clientStoreCtx.setStoreFromProfile(ownerProfile);
    }
  }, [clientStoreCtx, ownerProfile]);

  // Disponibiliza dados do veículo para o botão flutuante de WhatsApp
  useEffect(() => {
    if (!clientStoreCtx || !property) return;
    const anoMeta = property.diferenciais?.find((d) => /^ano:/i.test(d));
    const ano = anoMeta ? anoMeta.replace(/^ano:\s*/i, "") : property.year ? String(property.year) : null;
    const url = vehicleUrl(property, ownerProfile?.slug);
    clientStoreCtx.setCurrentVehicle({ titulo: property.titulo, ano, url });
    return () => clientStoreCtx.setCurrentVehicle(null);
  }, [clientStoreCtx, property, ownerProfile?.slug]);

  // Regera o card do WhatsApp em background quando o lojista abre a prévia
  // e os dados visíveis no card (preço/modelo/ano/cidade/loja) mudaram, ou
  // quando o card ainda não existe.
  useEffect(() => {
    if (!property?.id || !isAdminMode) return;
    ensureVehicleCard(property, ownerProfile).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    property?.id,
    isAdminMode,
    property?.preco,
    property?.titulo,
    property?.year,
    property?.fotoUrl,
    property?.cardSignature,
    ownerProfile?.nome,
  ]);

  useBrandColors(ownerProfile?.brandPrimaryColor, ownerProfile?.brandAccentColor, { applyTheme: true });

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="app-shell flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-xl font-bold mb-2">Veículo não encontrado</h1>
        <p className="text-sm text-muted-foreground mb-6">Esta landing page não existe ou foi removida.</p>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  // Redirect 301-like (client side): legado /veiculo/:id -> /:lojaSlug/:veiculoSlug
  if (!isSlugRoute && ownerProfile?.slug && property.slug) {
    return <Navigate to={`/${ownerProfile.slug}/${property.slug}`} replace />;
  }

  const fotos = property.fotosUrls?.length ? property.fotosUrls : property.fotoUrl ? [property.fotoUrl] : [];
  const cover = fotos[activePhoto];

  const storeName = ownerProfile?.nome?.trim() || "Loja parceira";
  const storeCity = property.bairro || property.endereco || "";

  // URL amigável (canonical) para compartilhar
  const friendlyUrl = vehicleUrl(property, ownerProfile?.slug);

  // URL versionada usada para compartilhar no WhatsApp. O parâmetro `v`
  // (timestamp de atualização do veículo) força o WhatsApp/Facebook a
  // ignorar o cache antigo quando o preço/modelo/ano mudar.
  const cardVersion = encodeURIComponent(
    property.updatedAt ?? property.publishedAt ?? String(property.preco),
  );
  const shareCardUrl = `https://igarageauto.vercel.app/c/${property.id}?v=${cardVersion}`;

  // Open Graph: título com nome + preço, descrição = nome da loja
  const ogTitle = `${property.titulo} • ${formatBRL(property.preco)}`;
  const ogDescription = storeName;

  const handleWhats = () => {
    registerLead(property.id, property.ownerId).catch(() => {});
  };

  const handleInteresse = () => {
    registerLead(property.id, property.ownerId).catch(() => {});
    toast({ title: "Interesse registrado", description: "A loja foi notificada e entrará em contato." });
  };

  const handleShare = async () => {
    // Sempre exige o link rastreável do Supabase (track-share). Só cai no
    // fallback do card versionado se a Edge Function realmente falhar.
    let shareUrl = "";
    try {
      const { data, error } = await supabase.functions.invoke("generate-share-link", {
        body: {
          vehicle_id: property.id,
          lojista_id: property.ownerId,
          original_url: shareCardUrl,
        },
      });
      if (!error && data?.tracking_link) {
        shareUrl = data.tracking_link as string;
      }
    } catch {
      /* trata abaixo */
    }
    if (!shareUrl) shareUrl = shareCardUrl;

    // Texto limpo, SEM o link embutido — o WhatsApp anexa a URL do campo `url`
    // uma única vez. Se colocássemos o link no texto E no url, apareceria duas
    // vezes na mensagem enviada pelo mobile.
    const shareText = `${property.titulo} — ${formatBRL(property.preco)}\n\n📲 Confira todos os detalhes:`;

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "Confira este veículo", text: shareText, url: shareUrl });
        return;
      }
    } catch {
      // usuário cancelou ou share falhou — cair no fallback
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({ title: "Link copiado!", description: "Compartilhe com seus clientes." });
    } catch {
      toast({ title: "Não foi possível copiar", description: shareUrl });
    }
  };

  const nextPhoto = () => setActivePhoto((i) => (i + 1) % fotos.length);
  const prevPhoto = () => setActivePhoto((i) => (i - 1 + fotos.length) % fotos.length);

  // Ano/Modelo: prioriza o valor completo salvo nos diferenciais (ex: 2022/2023);
  // se não existir, usa o campo year numérico.
  const getAnoModelo = (): string | null => {
    const anoMeta = property.diferenciais?.find((d) => /^ano:/i.test(d));
    if (anoMeta) return anoMeta.replace(/^ano:\s*/i, "");
    if (property.year !== null && property.year !== undefined) return String(property.year);
    return null;
  };

  const anoModelo = getAnoModelo();

  // Padroniza texto das características: "chave:valor" -> "CHAVE: VALOR".
  const formatSpecItem = (text: string) =>
    text
      .replace(/^([^:]+):(.+)$/, (_, key, value) => `${key.trim()}: ${value.trim()}`)
      .toUpperCase();

  // Cards de características — só mostra blocos com dados reais
  const specs: { label: string; value: string }[] = [];
  if (property.bairro) specs.push({ label: "Cidade", value: property.bairro });
  if (property.endereco) specs.push({ label: "Local", value: property.endereco });
  if (property.quartos > 0) specs.push({ label: "Itens", value: String(property.quartos) });

  return (
    <div className="app-shell pb-32 bg-background">
      <SeoTags
        title={ogTitle}
        description={ogDescription}
        image={cover || ""}
        url={friendlyUrl}
        type="article"
      />

      {/* Voltar — escondido no modo admin (a barra de prévia substitui o chrome do topo) */}
      {!isAdminMode && (
        <Link
          to={ownerProfile?.slug ? `/loja/${ownerProfile.slug}/vitrine` : "/"}
          className="fixed top-3 left-3 z-30 h-10 w-10 rounded-full bg-card/90 backdrop-blur border border-border flex items-center justify-center shadow-sm"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Compartilhar — só no modo cliente (no admin, a ação fica na barra de prévia) */}
      {!isAdminMode && (
        <button
          onClick={handleShare}
          aria-label="Compartilhar"
          className="group fixed top-3 right-3 z-40 h-12 sm:h-12 px-3 sm:px-5 rounded-full flex items-center justify-center gap-2 bg-black/55 backdrop-blur-md border border-[#D4AF37]/70 text-[#D4AF37] text-sm font-bold shadow-[0_4px_20px_rgba(212,175,55,0.35)] hover:scale-105 hover:shadow-[0_6px_28px_rgba(212,175,55,0.55)] hover:border-[#D4AF37] active:scale-95 transition-all duration-200"
        >
          <Share2 className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-[0_0_6px_rgba(212,175,55,0.6)] transition-transform group-hover:rotate-6" strokeWidth={2.25} />
          <span className="hidden sm:inline tracking-wide">Compartilhar</span>
        </button>
      )}

      {/* Barra "Modo prévia" — somente lojista/admin */}
      {isAdminMode && (
        <div className="sticky top-0 z-30 bg-[#141414] border-b border-[hsl(var(--gold)/0.3)] px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/"
              aria-label="Voltar"
              className="h-8 w-8 shrink-0 rounded-full border border-border/40 flex items-center justify-center text-foreground/80 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Eye className="h-4 w-4 text-[hsl(var(--gold))] shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--gold))] truncate">
              Modo prévia
            </span>
            
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              aria-label="Compartilhar"
              className="h-8 w-8 p-0 sm:w-auto sm:px-2.5 text-xs"
            >
              <Share2 className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
          </div>
        </div>
      )}

      {/* 1. HERO — IMAGEM PRINCIPAL FULLSCREEN */}
      <div className="relative w-full bg-muted overflow-hidden" style={{ height: "min(58vh, 400px)" }}>
        {cover ? (
          <img
            src={cover}
            alt={property.titulo}
            onClick={() => setLightboxOpen(true)}
            className="h-full w-full object-cover cursor-zoom-in"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-card">
            <Car className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground mt-2">Sem imagem</p>
          </div>
        )}

        {/* Overlay gradiente */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Setas */}
        {fotos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextPhoto}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur border border-border px-2.5 py-1 text-[11px] font-semibold">
              {activePhoto + 1}/{fotos.length}
            </div>
          </>
        )}

        <VehicleStatusBadges property={property} max={2} size="md" className="!left-14" />

        {/* Favorito — posicionado no canto inferior esquerdo do hero para não conflitar com o botão Compartilhar fixo no topo */}
        <div className="absolute bottom-3 left-3 z-10">
          <FavoriteButton vehicleId={property.id} size="md" />
        </div>

        {/* Indicador de zoom — canto inferior direito */}
        {cover && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ampliar foto"
            className="absolute bottom-3 right-3 z-10 h-10 w-10 rounded-full flex items-center justify-center bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:bg-white/25 transition"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        )}
      </div>

      {cover && (
        <p className="text-center text-[11px] text-white/50 mt-2 px-4">
          Toque na imagem para ampliar
        </p>
      )}

      <PhotoLightbox
        open={lightboxOpen}
        photos={fotos}
        index={activePhoto}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActivePhoto}
        alt={property.titulo}
      />

      {/* 2. MINIATURAS */}
      {fotos.length > 1 && (
        <div className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            {fotos.map((url, i) => (
              <button
                key={url + i}
                onClick={() => setActivePhoto(i)}
                className={`h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activePhoto ? "border-primary" : "border-border opacity-60"
                }`}
              >
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. BLOCO DO VEÍCULO — NOME + PREÇO */}
      <header className="px-4 mt-5">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{property.titulo}</h1>

        {storeCity && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {storeCity}
          </p>
        )}

        {property.vendido ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-4 py-3">
            <BadgeCheck className="h-5 w-5" />
            <span className="font-bold text-lg">Vendido</span>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Preço à vista
            </p>
            <p className="text-5xl font-extrabold text-primary leading-none mt-1">
              {formatBRL(property.preco)}
            </p>
          </div>
        )}

        {/* Quick info: ano · km · cidade */}
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          {anoModelo && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {anoModelo}
            </span>
          )}
          {property.km !== null && property.km !== undefined && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Gauge className="h-4 w-4 text-primary" />
              {property.km.toLocaleString("pt-BR")} km
            </span>
          )}
          {property.city && (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {property.city}
            </span>
          )}
        </div>
      </header>

      {/* 4. CARACTERÍSTICAS — CARDS */}
      {specs.length > 0 && (
        <section className="px-4 mt-6">
          <div className="grid grid-cols-2 gap-2.5">
            {specs.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-0.5"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {s.label}
                </p>
                <p className="text-base font-bold truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. DESCRIÇÃO CURTA */}
      {property.descricao && (
        <section className="mt-6 px-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Sobre o veículo</h2>
          <p className="text-sm leading-relaxed text-foreground/85 line-clamp-5">{property.descricao}</p>
        </section>
      )}

      {(() => {
        const TECH_KEYS = ["marca", "modelo", "ano", "cambio", "combustivel", "carroceria", "cor"];
        const techItems: string[] = [];
        const complementares: string[] = [];
        for (const d of property.diferenciais) {
          const m = d.match(/^([a-zA-Z]+):(.*)$/);
          const key = m?.[1]?.toLowerCase();
          if (key && TECH_KEYS.includes(key)) {
            techItems.push(d);
          } else if (key === "opcional") {
            complementares.push(m![2].trim());
          } else if (key === "km" || key === "video") {
            // exibidos em outros locais — ignorar aqui
          } else {
            complementares.push(d);
          }
        }
        return (
          <>
            {techItems.length > 0 && (
              <section className="mt-6 px-4">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3">Características</h2>
                <ul className="grid grid-cols-1 gap-2">
                  {techItems.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 rounded-xl bg-card border border-border px-3.5 py-2.5 text-sm font-medium"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{formatSpecItem(d)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {complementares.length > 0 && (
              <section className="mt-6 px-4">
                <h2 className="text-sm font-bold uppercase tracking-wider mb-3">
                  Características complementares
                </h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {complementares.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl bg-card border border-border px-3 py-2.5 text-xs font-semibold uppercase leading-snug"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="whitespace-normal break-words">{d.toUpperCase()}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      })()}

      {/* GATILHOS DE CONFIANÇA */}
      <section className="mt-6 px-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-card border border-border p-3 text-center">
            <ShieldCheck className="h-5 w-5 mx-auto text-primary" />
            <p className="text-[11px] mt-1 font-semibold">Revisado</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3 text-center">
            <RefreshCw className="h-5 w-5 mx-auto text-primary" />
            <p className="text-[11px] mt-1 font-semibold">Aceita troca</p>
          </div>
          <button
            type="button"
            onClick={() => setFinancingOpen(true)}
            className="rounded-2xl bg-primary border border-primary p-3 text-center text-primary-foreground cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-[0_0_24px_hsl(var(--primary)/0.45)] animate-pulse-gold"
          >
            <Calculator className="h-5 w-5 mx-auto" />
            <p className="text-[11px] mt-1 font-semibold">Simular Financiamento</p>
          </button>
        </div>
      </section>

      <FinancingModal
        open={financingOpen}
        onOpenChange={setFinancingOpen}
        whatsapp={ownerProfile?.whatsapp}
        vehicleTitle={property.titulo}
        vehicleYear={anoModelo}
      />

      {/* Localização */}
      {(property.latitude || property.endereco) && (
        <section className="mt-6 px-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Localização</h2>
          <PropertyMap latitude={property.latitude} longitude={property.longitude} endereco={property.endereco} />
        </section>
      )}

      {/* 5. BLOCO DA LOJA */}
      <section className="mt-8 px-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">
          Anunciado por
        </p>
        <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
          <StoreLogo
            src={ownerProfile?.fotoUrl}
            alt={storeName}
            className="h-14 w-14 bg-muted"
            fallbackIconClassName="h-6 w-6 text-muted-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold truncate">{storeName}</p>
            {storeCity && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {storeCity}
              </p>
            )}
          </div>
          <ClientSocialLinks profile={ownerProfile} className="shrink-0" />
        </div>
      </section>

      {/* CTA FINAL — Tenho interesse (WhatsApp via botão flutuante do layout) */}
      {!property.vendido && (
        <section className="mt-6 px-4 space-y-3">
          <button
            onClick={handleInteresse}
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/10 transition-colors"
          >
            <Heart className="h-4 w-4" />
            Tenho interesse
          </button>
        </section>
      )}
    </div>
  );
}
