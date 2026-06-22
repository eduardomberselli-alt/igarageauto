import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { MapPin, MessageCircle, Store, ExternalLink, Instagram, Facebook, Youtube, Linkedin, Globe, Music2 } from "lucide-react";
import { ClientHeader } from "@/components/client/ClientHeader";
import { StoreLogo } from "@/components/client/StoreLogo";
import { SeoTags } from "@/components/SeoTags";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPortfolio } from "@/hooks/usePublicPortfolio";
import { onlyDigits } from "@/lib/format";

export default function ClientLoja() {
  const { lojaSlug } = useParams();
  const { profile, properties, loading, notFound } = usePublicPortfolio(lojaSlug);

  const { sobreText, infoChips } = useMemo(() => {
    const esp = profile?.especialidades ?? [];
    let sobre = "";
    const infos: string[] = [];
    for (const e of esp) {
      if (!sobre && e.startsWith("sobre:")) sobre = e.slice("sobre:".length).trim();
      else infos.push(e);
    }
    return { sobreText: sobre, infoChips: infos };
  }, [profile]);

  const waUrl = profile?.whatsapp
    ? `https://wa.me/${onlyDigits(profile.whatsapp)}?text=${encodeURIComponent(
        `Olá ${profile.nome}! Gostaria de mais informações sobre os veículos da loja.`,
      )}`
    : null;

  if (loading) {
    return (
      <>
        <ClientHeader />
        <main className="px-4 pt-4 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
        </main>
      </>
    );
  }

  if (notFound || !profile) {
    return (
      <>
        <ClientHeader />
        <main className="px-4 pt-12 text-center">
          <p className="text-sm text-white/50">Loja não encontrada.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SeoTags
        title={profile.nome}
        description="Confira nosso estoque e fale com a nossa equipe."
        image={profile.fotoUrl ?? undefined}
      />
      <ClientHeader compact />
      <main className="pb-4">
        <header className="px-4 pt-6 pb-5 text-center">
          <StoreLogo
            src={profile.fotoUrl}
            alt={profile.nome}
            className="h-24 w-24 mx-auto ring-2 ring-[hsl(var(--primary))]/40 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)]"
            fallbackIconClassName="h-10 w-10 text-white/40"
          />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{profile.nome}</h1>
          {infoChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {infoChips.map((e) => (
                <span
                  key={e}
                  className="text-[11px] bg-white/5 px-2.5 py-1 rounded-full text-white/70"
                >
                  {e}
                </span>
              ))}
            </div>
          )}
        </header>

        {sobreText && (
          <section className="px-4 mt-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold text-center mb-3">
              Sobre a loja
            </p>
            <div className="rounded-2xl bg-[#141414] border border-white/5 px-6 py-6 max-w-md mx-auto">
              <p className="text-[15px] leading-relaxed text-white/85 text-center whitespace-pre-line">
                {sobreText}
              </p>
            </div>
          </section>
        )}

        <section className="px-4 mt-5">
          <div className="rounded-2xl bg-[#141414] border border-white/5 p-4 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                Veículos no portfólio
              </p>
              <p className="font-semibold mt-0.5">{properties.length}</p>
            </div>
            {profile.whatsapp && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  Contato
                </p>
                <p className="font-semibold mt-0.5 inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  {profile.whatsapp}
                </p>
              </div>
            )}
          </div>
        </section>

        {(profile.address || profile.mapsUrl) && (
          <section className="px-4 mt-5">
            <div className="rounded-2xl bg-[#141414] border border-white/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                    Endereço da loja
                  </p>
                  {profile.address ? (
                    <p className="font-medium mt-0.5 text-sm leading-snug">{profile.address}</p>
                  ) : (
                    <p className="font-medium mt-0.5 text-sm text-white/60">Veja no mapa</p>
                  )}
                </div>
              </div>
              {profile.mapsUrl && (
                <a
                  href={profile.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Google Maps
                </a>
              )}
            </div>
          </section>
        )}

        {(() => {
          const socials = [
            { url: profile.instagramUrl, label: "Instagram", Icon: Instagram },
            { url: profile.facebookUrl, label: "Facebook", Icon: Facebook },
            { url: profile.tiktokUrl, label: "TikTok", Icon: Music2 },
            { url: profile.youtubeUrl, label: "YouTube", Icon: Youtube },
            { url: profile.linkedinUrl, label: "LinkedIn", Icon: Linkedin },
            { url: profile.websiteUrl, label: "Site", Icon: Globe },
          ].filter((s) => s.url && s.url.trim());

          if (socials.length === 0) return null;

          return (
            <section className="px-4 mt-5">
              <div className="rounded-2xl bg-[#141414] border border-white/5 p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-3">
                  Redes Sociais
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {socials.map(({ url, label, Icon }) => (
                    <a
                      key={label}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 h-11 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      <span className="truncate">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {waUrl && (
          <section className="px-4 mt-5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-[hsl(var(--whatsapp))] text-white font-bold text-base shadow-[0_8px_24px_-6px_hsl(var(--whatsapp)/0.5)] hover:opacity-95 transition-opacity"
            >
              <MessageCircle className="h-5 w-5" />
              Falar com a loja
            </a>
          </section>
        )}
      </main>
    </>
  );
}
