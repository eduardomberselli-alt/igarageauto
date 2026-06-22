import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, MessageCircle, BadgeCheck, Bed, Sparkles, PlayCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPortfolio } from "@/hooks/usePublicPortfolio";
import { registerLead } from "@/hooks/useAppData";
import { formatBRL, onlyDigits } from "@/lib/format";
import { ytEmbed, ytThumb } from "@/lib/youtube";
import { PublicBottomNav, type PublicTab } from "@/components/PublicBottomNav";
import { ConhecimentoView } from "@/components/ConhecimentoView";
import { useLearningContent } from "@/hooks/useLearningContent";
import { useCertifications } from "@/hooks/useCertifications";
import { Building2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { useBrandColors } from "@/hooks/useBrandColors";
import { SeoTags } from "@/components/SeoTags";
import { PortfolioFilters, applyFilters, emptyFilters, type Filters } from "@/components/PortfolioFilters";
import { SocialProofRow } from "@/components/SocialProofRow";
import { vehiclePath } from "@/lib/vehicleUrl";


export default function PublicPortfolio() {
  const { slug } = useParams();
  const { profile, properties, loading, notFound } = usePublicPortfolio(slug);
  const [tab, setTab] = useState<PublicTab>("portfolio");
  const [filter, setFilter] = useState<"todos" | "disponivel" | "vendido">("todos");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const { items: learning, loading: learningLoading } = useLearningContent("publico");
  const { items: certifications, loading: certsLoading } = useCertifications(profile?.userId);

  useBrandColors(profile?.brandPrimaryColor, profile?.brandAccentColor, { applyTheme: true });

  const filtered = useMemo(() => {
    let list = properties;
    if (filter === "disponivel") list = list.filter((p) => !p.vendido);
    else if (filter === "vendido") list = list.filter((p) => p.vendido);
    return applyFilters(list, filters);
  }, [properties, filter, filters]);

  // Métricas de prova social — calculadas em memória a partir dos dados já carregados
  const soldCount = useMemo(() => properties.filter((p) => p.vendido).length, [properties]);
  const interestedToday = useMemo(
    () => properties.reduce((acc, p) => acc + (p.whatsappClicksToday ?? 0), 0),
    [properties],
  );

  const allVideos = useMemo(
    () =>
      properties.flatMap((p) =>
        p.videos.map((v) => ({
          ...v,
          propertyId: p.id,
          propertyTitulo: p.titulo,
          propertyFoto: p.fotoUrl,
        })),
      ),
    [properties],
  );

  if (loading) {
    return (
      <div className="app-shell px-4 pt-6 pb-24 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="app-shell flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-xl font-bold mb-2">Portfólio não encontrado</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Este lojista não existe ou ainda não publicou veículos.
        </p>
        <Button asChild>
          <Link to="/">Voltar</Link>
        </Button>
      </div>
    );
  }

  const handleWhatsAppGeral = () => {
    if (properties[0]) {
      registerLead(properties[0].id, profile.userId).catch(() => {});
    }
  };

  const waMsgGeral = encodeURIComponent(
    `Olá! Vi este veículo no Garage e gostaria de mais informações.`,
  );
  const waUrlGeral = profile.whatsapp
    ? `https://wa.me/${onlyDigits(profile.whatsapp)}?text=${waMsgGeral}`
    : null;

  return (
    <div className="app-shell safe-bottom" style={{ paddingBottom: "100px" }}>
      <SeoTags
        title={`${profile.nome} — Garage`}
        description={`Portfólio profissional de veículos com curadoria técnica.`}
        image={profile.fotoUrl}
        type="profile"
      />
      {/* Header de perfil — sempre visível */}
      <header className="relative bg-gradient-to-b from-primary/20 via-primary/5 to-background pt-8 pb-6 px-4">
        <div className="flex flex-col items-center text-center">
          <img
            src={profile.fotoUrl || "/placeholder.svg"}
            alt={profile.nome}
            className="h-24 w-24 rounded-full object-cover bg-muted ring-2 ring-rose-gold/40 shadow-[var(--shadow-elev)]"
          />
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-rose-gold font-semibold">
            Lojista
          </p>
          <h1 className="text-2xl font-bold mt-0.5">{profile.nome}</h1>

          {/* Branding Garage */}
          <div className="mt-5">
            <Logo size={48} />
          </div>
          <p className="text-xs italic text-muted-foreground mt-2 max-w-[280px]">
            A excelência técnica que o seu patrimônio exige.
          </p>

          {tab === "portfolio" && profile.especialidades.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {profile.especialidades.map((e) => (
                <span
                  key={e}
                  className="text-xs glass px-3 py-1 rounded-full text-muted-foreground"
                >
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Prova social — sempre visível, abaixo do header */}
      <section className="px-4 mt-4">
        <SocialProofRow soldCount={soldCount} interestedToday={interestedToday} />
      </section>

      {/* PORTFÓLIO */}
      {tab === "portfolio" && (
        <>
          <section className="px-4 mt-4">
            <PortfolioFilters
              filters={filters}
              onChange={setFilters}
              properties={properties}
            />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Veículos ({filtered.length})
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {(["todos", "disponivel", "vendido"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    filter === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border"
                  }`}
                >
                  {k === "todos" ? "Todos" : k === "disponivel" ? "Disponíveis" : "Vendidos"}
                </button>
              ))}
            </div>
          </section>

          <section className="px-4 mt-4 space-y-3">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">
                Nenhum veículo nesta categoria.
              </p>
            )}
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={vehiclePath(p, profile.slug)}
                className="block rounded-2xl overflow-hidden glass-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elev)] hover-glow-rose transition-all"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {p.fotoUrl && (
                    <img src={p.fotoUrl} alt={p.titulo} className="h-full w-full object-cover" />
                  )}
                  {p.vendido && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
                      <BadgeCheck className="h-3 w-3" />
                      Vendido
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold leading-tight line-clamp-1">{p.titulo}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {p.bairro}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    {p.vendido ? (
                      <span className="text-sm font-semibold text-primary">Vendido</span>
                    ) : (
                      <span className="text-lg font-bold text-primary">{formatBRL(p.preco)}</span>
                    )}
                    {p.quartos > 0 && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        {p.quartos}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}

      {/* VÍDEOS */}
      {tab === "videos" && (
        <section className="px-4 mt-4 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Vitrine de Vídeos ({allVideos.length})
          </h2>
          {allVideos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              Este lojista ainda não publicou vídeos.
            </p>
          )}
          <div className="space-y-4">
            {allVideos.map((v) => (
              <article
                key={v.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]"
              >
                <div className="aspect-video bg-muted relative">
                  {activeVideo === v.id ? (
                    <iframe
                      src={ytEmbed(v.youtubeId)}
                      title={v.titulo}
                      className="h-full w-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveVideo(v.id)}
                      className="group relative h-full w-full"
                    >
                      <img
                        src={ytThumb(v.youtubeId)}
                        alt={v.titulo}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <PlayCircle className="h-14 w-14 text-white drop-shadow-lg" />
                      </div>
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold leading-tight">{v.titulo}</h3>
                  <Link
                    to={vehiclePath(
                      properties.find((pp) => pp.id === v.propertyId) ?? { id: v.propertyId, slug: null, ownerId: profile.userId },
                      profile.slug,
                    )}
                    className="mt-1 text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    {v.propertyTitulo}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CONHECIMENTO — vídeos educativos públicos */}
      {tab === "conhecimento" && (
        <ConhecimentoView items={learning} loading={learningLoading} audience="publico" />
      )}

      {/* CAPACITAÇÃO — currículo profissional do corretor */}
      {tab === "capacitacao" && (
        <section className="px-4 mt-4 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Currículo Profissional
          </h2>

          {certifications.length > 0 && (
            <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[hsl(var(--gold))]" />
                <span className="text-sm font-semibold text-[hsl(var(--gold))]">
                  Lojista Certificado
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {profile.nome.split(" ")[0]} possui {certifications.length}{" "}
                {certifications.length === 1 ? "certificação registrada" : "certificações registradas"}
                {" "}em sua trajetória profissional.
              </p>
            </div>
          )}

          {certsLoading && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!certsLoading && certifications.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Currículo em construção.
            </p>
          )}

          {/* Linha do tempo elegante */}
          {!certsLoading && certifications.length > 0 && (
            <div className="space-y-3">
              {certifications.map((c) => (
                <article
                  key={c.id}
                  className="relative rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.categoria && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {c.categoria}
                          </span>
                        )}
                        {c.ano && (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {c.ano}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold leading-tight mt-1">{c.nome}</p>
                      {c.instituicao && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.instituicao}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {profile.especialidades.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Áreas de atuação
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.especialidades.map((e) => (
                  <span
                    key={e}
                    className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PERFIL */}
      {tab === "perfil" && (
        <section className="px-4 mt-4 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sobre o Lojista
          </h2>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome</p>
              <p className="font-medium">{profile.nome}</p>
            </div>
            {profile.whatsapp && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  WhatsApp
                </p>
                <p className="font-medium">{profile.whatsapp}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Veículos no portfólio
              </p>
              <p className="font-medium">{properties.length}</p>
            </div>
          </div>

          {profile.especialidades.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Especialidades
              </p>
              <div className="flex flex-wrap gap-1.5">
                {profile.especialidades.map((e) => (
                  <span
                    key={e}
                    className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar de captura de lead */}
          <div className="glass-card rounded-2xl p-4 space-y-3 border border-rose-gold/30">
            <div>
              <h3 className="font-display text-lg">Quero falar com {profile.nome.split(" ")[0]}</h3>
              <p className="text-xs text-muted-foreground">
                Deixe seu contato e seja atendido pessoalmente.
              </p>
            </div>
            <LeadCaptureForm
              brokerId={profile.userId}
              brokerWhatsapp={profile.whatsapp}
              ctaLabel="Enviar e abrir WhatsApp"
            />
          </div>
        </section>
      )}

      {/* FAB de WhatsApp — circular, ícone apenas */}
      {waUrlGeral && (
        <div
          className="fixed right-4 z-40"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
        >
          <a
            href={waUrlGeral}
            onClick={handleWhatsAppGeral}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Falar com ${profile.nome.split(" ")[0]} no WhatsApp`}
            className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-whatsapp text-white shadow-[var(--shadow-elev)] hover-glow-rose"
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </a>
        </div>
      )}

      <PublicBottomNav active={tab} onChange={(t) => { setTab(t); setActiveVideo(null); }} />
    </div>
  );
}
