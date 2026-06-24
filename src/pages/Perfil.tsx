import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, LogOut, Copy, ExternalLink, Download, Upload, Loader2, Share2, Store, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useAppData";
import { useAuth } from "@/hooks/useAuth";
import { useAdminView } from "@/contexts/AdminViewContext";

import { supabase } from "@/integrations/supabase/client";
import { compressImage, generateWatermarkPng } from "@/lib/imageCompression";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}


// "Sobre a loja" + "Informações" são salvos dentro de especialidades:
// - primeiro item, se prefixado com "sobre:", é o texto sobre a loja
// - demais itens são informações da loja
function parseEspecialidades(esp: string[]): { sobre: string; infos: string[] } {
  let sobre = "";
  const infos: string[] = [];
  for (const e of esp) {
    if (!sobre && e.startsWith("sobre:")) sobre = e.slice("sobre:".length);
    else infos.push(e);
  }
  return { sobre, infos };
}

function buildEspecialidades(sobre: string, infos: string[]): string[] {
  const out: string[] = [];
  if (sobre.trim()) out.push(`sobre:${sobre.trim()}`);
  out.push(...infos.filter((i) => i.trim()));
  return out;
}

export default function Perfil() {
  const { effectiveUserId } = useAdminView();
  const { profile, loading, save } = useProfile(effectiveUserId);
  const { signOut, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    fotoUrl: "",
    whatsapp: "",
    slug: "",
    sobre: "",
    infos: [] as string[],
    address: "",
    mapsUrl: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    urlMarcaDagua: "",
    logoLojaUrl: "",
  });
  const [novaInfo, setNovaInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [generatingWm, setGeneratingWm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      const { sobre, infos } = parseEspecialidades(profile.especialidades);
      setForm({
        nome: profile.nome,
        fotoUrl: profile.fotoUrl,
        whatsapp: profile.whatsapp,
        slug: profile.slug ?? "",
        sobre,
        infos,
        address: profile.address ?? "",
        mapsUrl: profile.mapsUrl ?? "",
        instagramUrl: profile.instagramUrl ?? "",
        facebookUrl: profile.facebookUrl ?? "",
        tiktokUrl: profile.tiktokUrl ?? "",
        youtubeUrl: profile.youtubeUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        urlMarcaDagua: profile.urlMarcaDagua ?? "",
        logoLojaUrl: (profile as any).logoLojaUrl ?? "",
      });
    }
  }, [profile]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addInfo = () => {
    const t = novaInfo.trim();
    if (!t) return;
    update("infos", [...form.infos, t]);
    setNovaInfo("");
  };

  const removeInfo = (i: number) =>
    update("infos", form.infos.filter((_, idx) => idx !== i));

  const buildPayload = () => ({
    nome: form.nome,
    fotoUrl: form.fotoUrl,
    whatsapp: form.whatsapp,
    slug: form.slug ? slugify(form.slug) : null,
    especialidades: buildEspecialidades(form.sobre, form.infos),
    address: form.address.trim() || null,
    mapsUrl: form.mapsUrl.trim() || null,
    instagramUrl: form.instagramUrl.trim() || null,
    facebookUrl: form.facebookUrl.trim() || null,
    tiktokUrl: form.tiktokUrl.trim() || null,
    youtubeUrl: form.youtubeUrl.trim() || null,
    linkedinUrl: form.linkedinUrl.trim() || null,
    websiteUrl: form.websiteUrl.trim() || null,
    urlMarcaDagua: form.urlMarcaDagua.trim() || null,
    logoLojaUrl: form.logoLojaUrl.trim() || null,
  });

  const handleSave = async () => {
    setBusy(true);
    const err = await save(buildPayload() as any);
    setBusy(false);
    if (err) {
      if ((err as any).code === "23505") toast.error("Este link já está em uso. Escolha outro.");
      else toast.error(err.message);
    } else {
      toast.success("Perfil salvo");
    }
  };

  const handleGenerateWatermark = async () => {
    if (!user) return;
    if (!form.logoLojaUrl) {
      toast.error("Por favor, faça o upload do Logotipo da Loja primeiro.");
      return;
    }
    setGeneratingWm(true);
    try {
      const blob = await generateWatermarkPng(form.logoLojaUrl, { maxWidth: 200, opacity: 0.30 });
      const path = `${user.id}/watermarks/watermark-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { cacheControl: "3600", upsert: true, contentType: "image/png" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setForm((p) => ({ ...p, urlMarcaDagua: publicUrl }));
      const err = await save({ ...buildPayload(), urlMarcaDagua: publicUrl } as any);
      if (err) throw err;
      toast.success("Marca d'água gerada e salva!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Falha ao gerar marca d'água (verifique CORS da logo)");
    } finally {
      setGeneratingWm(false);
    }
  };

  const handleRemoveWatermark = async () => {
    setForm((p) => ({ ...p, urlMarcaDagua: "" }));
    const err = await save({ ...buildPayload(), urlMarcaDagua: null } as any);
    if (err) toast.error(err.message);
    else toast.success("Marca d'água removida");
  };

  const hasSlug = !!form.slug.trim();
  const portfolioPath = hasSlug ? `/p/${slugify(form.slug)}` : "";
  const portfolioUrl =
    typeof window !== "undefined" && portfolioPath ? `${window.location.origin}${portfolioPath}` : "";

  const copyLink = async () => {
    if (!portfolioUrl) return;
    await navigator.clipboard.writeText(portfolioUrl);
    toast.success("Link copiado!");
  };

  const shareLink = async () => {
    if (!portfolioUrl) return;
    const message = `Confira meus veículos disponíveis: ${portfolioUrl}`;
    const canShare =
      typeof navigator !== "undefined" &&
      typeof (navigator as any).share === "function";
    if (canShare) {
      try {
        await (navigator as any).share({
          title: form.nome || "Minha loja",
          text: "Confira meus veículos disponíveis:",
          url: portfolioUrl,
        });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Link e mensagem copiados!");
    } catch {
      toast.error("Não foi possível compartilhar");
    }
  };

  const downloadQr = () => {
    const canvas = document.getElementById("portfolio-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qrcode-${form.slug || "loja"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original || !user) return;

    if (!original.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    setUploading(true);
    try {
      let file = original;
      try {
        file = await compressImage(original, { maxBytes: 5 * 1024 * 1024, maxDimension: 1024 });
      } catch {
        /* mantém original */
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande (não foi possível reduzir abaixo de 5MB)");
        setUploading(false);
        return;
      }

      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      setForm((p) => ({ ...p, fotoUrl: publicUrl }));
      const err = await save({ ...buildPayload(), fotoUrl: publicUrl } as any);
      if (err) throw err;
      toast.success("Logo atualizado");
    } catch (err: any) {
      if (err?.code === "23505") toast.error("Este link já está em uso. Escolha outro.");
      else toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original || !user) return;
    if (!original.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    setUploadingLogo(true);
    try {
      // Não comprimir PNG transparente para preservar canal alfa
      const isPng = original.type === "image/png";
      let file = original;
      if (!isPng) {
        try {
          file = await compressImage(original, { maxBytes: 2 * 1024 * 1024, maxDimension: 1024 });
        } catch { /* mantém original */ }
      }
      const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
      const path = `${user.id}/logo-loja-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setForm((p) => ({ ...p, logoLojaUrl: publicUrl }));
      const err = await save({ ...buildPayload(), logoLojaUrl: publicUrl } as any);
      if (err) throw err;
      toast.success("Logotipo da loja enviado");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar logotipo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-5 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={() => navigate("/admin/lojas")}>
              <Store className="h-4 w-4" />
              Nova Loja
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      {loading && <Skeleton className="h-96 w-full rounded-2xl" />}

      {!loading && (
        <>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={form.fotoUrl || "/placeholder.svg"}
                alt={form.nome}
                className="h-24 w-24 rounded-full object-cover bg-muted ring-4 ring-card shadow-[var(--shadow-elev)]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[var(--shadow-elev)] hover:bg-primary/90 disabled:opacity-50"
                aria-label="Trocar logo"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <p className="mt-2 text-sm font-medium">{form.nome || user?.email}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="text-[11px] text-muted-foreground mt-1 text-center">
              Toque no ícone para enviar o logo da sua loja (máx. 5MB)
            </p>

            {/* Marca d'água automática */}
            <div className="mt-4 w-full max-w-xs rounded-2xl border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                Logotipo da Loja
              </p>
              <div
                className="h-24 w-full rounded-lg border border-border flex items-center justify-center overflow-hidden mb-2"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
                }}
              >
                {form.logoLojaUrl ? (
                  <img src={form.logoLojaUrl} alt="Logotipo da loja" className="max-h-20 max-w-[80%] object-contain" />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Nenhum logotipo enviado</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {form.logoLojaUrl ? "Trocar logotipo" : "Enviar logotipo"}
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="mt-2 text-[10px] text-muted-foreground text-center leading-tight">
                Suba aqui o logo da sua loja (de preferência em formato PNG com fundo transparente) para ser usado na geração da marca d'água das fotos.
              </p>

              <div className="my-3 h-px bg-border" />

              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 text-center">
                Marca d'água nas fotos
              </p>
              {form.urlMarcaDagua ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="h-32 w-full rounded-lg border border-border flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
                    }}
                  >
                    <img
                      src={form.urlMarcaDagua}
                      alt="Marca d'água"
                      className="max-h-28 max-w-[80%] object-contain"
                    />
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={handleGenerateWatermark}
                      disabled={generatingWm || !form.logoLojaUrl}
                    >
                      {generatingWm ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Regenerar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveWatermark}
                      aria-label="Remover marca d'água"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">
                    💡 Para um melhor resultado, use uma imagem em formato PNG com fundo transparente contendo apenas o logotipo da sua loja.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={handleGenerateWatermark}
                  disabled={generatingWm || !form.logoLojaUrl}
                >
                  {generatingWm ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  ✨ Gerar Marca d'Água Automática
                </Button>
              )}
              <p className="mt-2 text-[10px] text-muted-foreground text-center leading-tight">
                Gera uma versão da sua logo com 30% de opacidade, aplicada no centro das fotos dos veículos.
              </p>
            </div>
          </div>

          {/* Link da loja */}
          {!hasSlug && (
            <section className="mb-6 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Link da minha loja
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina o link da sua loja para ativar o compartilhamento.
              </p>
            </section>
          )}

          {hasSlug && portfolioUrl && (
            <section className="mb-6 rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Link da minha loja
              </h2>
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs break-all">
                {portfolioUrl}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={portfolioPath} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Abrir
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={shareLink}>
                  <Share2 className="h-4 w-4" />
                  Enviar
                </Button>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeCanvas
                    id="portfolio-qr"
                    value={portfolioUrl}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={downloadQr} className="mt-2">
                  <Download className="h-4 w-4" />
                  Baixar QR Code
                </Button>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                Compartilhe sua loja com clientes pelo WhatsApp ou presencialmente.
              </p>
            </section>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome da loja</Label>
              <Input
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                placeholder="Ex: Auto Silva"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Link da sua loja</Label>
              <Input
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="ex: auto-silva"
              />
              <p className="text-xs text-muted-foreground">
                Aparece em <span className="font-mono">/p/{slugify(form.slug) || "sua-loja"}</span>. Use um nome simples e único.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder="+55 (11) 98765-4321"
              />
              <p className="text-xs text-muted-foreground">
                Este número receberá os contatos dos clientes interessados nos veículos.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Endereço da loja</Label>
              <Input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Rua X, 123 - Bento Gonçalves - RS"
              />
              <p className="text-xs text-muted-foreground">
                Endereço físico da loja (opcional).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Link da localização</Label>
              <Input
                value={form.mapsUrl}
                onChange={(e) => update("mapsUrl", e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                inputMode="url"
              />
              <p className="text-xs text-muted-foreground">
                Permite que o cliente abra a localização da loja diretamente no Google Maps.
              </p>
            </div>

            {/* Sobre a loja */}
            <div className="space-y-1.5">
              <Label>Sobre a loja</Label>
              <Textarea
                rows={3}
                value={form.sobre}
                onChange={(e) => update("sobre", e.target.value)}
                placeholder="Ex: Trabalhamos com veículos revisados, procedência garantida e financiamento facilitado"
              />
            </div>




            {/* Informações da loja */}
            <section className="space-y-2">
              <div>
                <Label>Informações da loja (opcional)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione informações que aumentem a confiança dos clientes.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={novaInfo}
                  onChange={(e) => setNovaInfo(e.target.value)}
                  placeholder="Ex: Mais de 10 anos no mercado"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInfo())}
                />
                <Button type="button" size="icon" onClick={addInfo} aria-label="Adicionar informação">
                  <Plus />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {form.infos.map((info, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium"
                  >
                    {info}
                    <button
                      onClick={() => removeInfo(i)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {form.infos.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Sugestões: "Veículos com garantia", "Aceitamos troca", "Financiamento facilitado"
                  </p>
                )}
              </div>
            </section>

            {/* Redes Sociais */}
            <section className="space-y-3 pt-2">
              <div>
                <Label className="text-base">Redes Sociais</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Todos os campos são opcionais. Aparecem na página pública da loja.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Instagram</Label>
                <Input
                  value={form.instagramUrl}
                  onChange={(e) => update("instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/minhaloja"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Facebook</Label>
                <Input
                  value={form.facebookUrl}
                  onChange={(e) => update("facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/minhaloja"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">TikTok</Label>
                <Input
                  value={form.tiktokUrl}
                  onChange={(e) => update("tiktokUrl", e.target.value)}
                  placeholder="https://tiktok.com/@minhaloja"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">YouTube</Label>
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => update("youtubeUrl", e.target.value)}
                  placeholder="https://youtube.com/@minhaloja"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">LinkedIn</Label>
                <Input
                  value={form.linkedinUrl}
                  onChange={(e) => update("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/company/minhaloja"
                  inputMode="url"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Site</Label>
                <Input
                  value={form.websiteUrl}
                  onChange={(e) => update("websiteUrl", e.target.value)}
                  placeholder="https://www.minhaloja.com.br"
                  inputMode="url"
                />
              </div>
            </section>

            <Button onClick={handleSave} size="lg" className="w-full mt-2" disabled={busy}>
              Salvar perfil
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
