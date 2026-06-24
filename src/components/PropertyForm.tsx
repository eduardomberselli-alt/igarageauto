import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Upload, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MAX_PROPERTY_PHOTOS, type Property } from "@/types";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/imageCompression";

export type PropertyFormValues = {
  titulo: string;
  preco: number;
  bairro: string;
  endereco: string;
  fotoUrl: string;
  fotosUrls: string[];
  descricao: string;
  diferenciais: string[];
  vendido: boolean;
  quartos: number;
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  year?: number | null;
  km?: number | null;
  city?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Property | null;
  onSave: (p: PropertyFormValues, id?: string) => void;
};

const MAX_PHOTO_SIZE_MB = 1;

const CAMBIOS = ["Manual", "Automático", "CVT"] as const;
const COMBUSTIVEIS = ["Flex", "Gasolina", "Diesel", "Elétrico", "Híbrido"] as const;
const CARROCERIAS = ["Hatch", "Sedan", "SUV", "Pickup"] as const;

type AutoMeta = {
  marca: string;
  modelo: string;
  ano: string;
  km: string;
  cambio: string;
  combustivel: string;
  carroceria: string;
  cor: string;
  video: string;
};

const emptyMeta: AutoMeta = {
  marca: "",
  modelo: "",
  ano: "",
  km: "",
  cambio: "",
  combustivel: "",
  carroceria: "",
  cor: "",
  video: "",
};

const META_KEYS: (keyof AutoMeta)[] = [
  "marca", "modelo", "ano", "km", "cambio", "combustivel", "carroceria", "cor", "video",
];

function parseMeta(diferenciais: string[]): { meta: AutoMeta; rest: string[] } {
  const meta: AutoMeta = { ...emptyMeta };
  const rest: string[] = [];
  for (const d of diferenciais) {
    const m = d.match(/^([a-z]+):(.*)$/i);
    if (m && (META_KEYS as string[]).includes(m[1].toLowerCase())) {
      meta[m[1].toLowerCase() as keyof AutoMeta] = m[2];
    } else {
      rest.push(d);
    }
  }
  return { meta, rest };
}

function metaToDiferenciais(meta: AutoMeta, rest: string[]): string[] {
  const tagged = META_KEYS
    .filter((k) => meta[k]?.trim())
    .map((k) => `${k}:${meta[k].trim()}`);
  return [...tagged, ...rest];
}

const empty: PropertyFormValues = {
  titulo: "",
  preco: 0,
  bairro: "",
  endereco: "",
  fotoUrl: "",
  fotosUrls: [],
  descricao: "",
  diferenciais: [],
  vendido: false,
  quartos: 0,
  latitude: null,
  longitude: null,
  neighborhood: null,
  year: null,
  km: null,
  city: null,
};

export function PropertyForm({ open, onOpenChange, initial, onSave }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<PropertyFormValues>(empty);
  const [meta, setMeta] = useState<AutoMeta>(emptyMeta);
  const [restDif, setRestDif] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const fotos = initial.fotosUrls && initial.fotosUrls.length > 0
        ? initial.fotosUrls
        : initial.fotoUrl ? [initial.fotoUrl] : [];
      const { meta: m, rest } = parseMeta(initial.diferenciais ?? []);
      setForm({
        titulo: initial.titulo,
        preco: initial.preco,
        bairro: initial.bairro,
        endereco: initial.endereco,
        fotoUrl: fotos[0] ?? "",
        fotosUrls: fotos,
        descricao: initial.descricao,
        diferenciais: initial.diferenciais,
        vendido: initial.vendido,
        quartos: initial.quartos,
        latitude: initial.latitude ?? null,
        longitude: initial.longitude ?? null,
        neighborhood: initial.neighborhood ?? null,
        year: initial.year ?? null,
        km: initial.km ?? null,
        city: initial.city ?? null,
      });
      setMeta(m);
      setRestDif(rest);
    } else {
      setForm(empty);
      setMeta(emptyMeta);
      setRestDif([]);
    }
  }, [open, initial]);

  const update = <K extends keyof PropertyFormValues>(k: K, v: PropertyFormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const updateMeta = <K extends keyof AutoMeta>(k: K, v: AutoMeta[K]) =>
    setMeta((p) => ({ ...p, [k]: v }));

  const setFotos = (next: string[]) =>
    setForm((p) => ({ ...p, fotosUrls: next, fotoUrl: next[0] ?? "" }));

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast.error("Faça login para enviar fotos");
      return;
    }

    const remaining = MAX_PROPERTY_PHOTOS - form.fotosUrls.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_PROPERTY_PHOTOS} fotos`);
      return;
    }

    const list = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.warning(`Apenas ${remaining} foto(s) serão adicionadas (limite ${MAX_PROPERTY_PHOTOS})`);
    }

    setUploading(true);
    const folder = initial?.id ?? user.id;
    const uploaded: string[] = [];
    for (const original of list) {
      if (!original.type.startsWith("image/")) {
        toast.error(`"${original.name}" não é uma imagem`);
        continue;
      }
      let file = original;
      try {
        file = await compressImage(original, {
          maxBytes: MAX_PHOTO_SIZE_MB * 1024 * 1024,
          maxDimension: 1920,
        });
      } catch {
        // mantém o original
      }
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        toast.error(`"${original.name}" não pôde ser reduzida para ${MAX_PHOTO_SIZE_MB}MB`);
        continue;
      }
      const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
      const path = `${user.id}/${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("properties")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        toast.error(`Falha ao enviar ${file.name}: ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("properties").getPublicUrl(path);
      if (pub?.publicUrl) uploaded.push(pub.publicUrl);
    }
    if (uploaded.length > 0) {
      setFotos([...form.fotosUrls, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) enviada(s)`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFoto = (idx: number) => setFotos(form.fotosUrls.filter((_, i) => i !== idx));

  const makeCover = (idx: number) => {
    if (idx === 0) return;
    const next = [...form.fotosUrls];
    const [chosen] = next.splice(idx, 1);
    next.unshift(chosen);
    setFotos(next);
  };

  const submit = () => {
    if (!form.titulo.trim()) {
      toast.error("Informe um título");
      return;
    }
    const finalForm: PropertyFormValues = {
      ...form,
      diferenciais: metaToDiferenciais(meta, restDif),
    };
    onSave(finalForm, initial?.id);
    onOpenChange(false);
  };

  const canAddMore = form.fotosUrls.length < MAX_PROPERTY_PHOTOS;

  const SelectChips = ({
    options, value, onChange,
  }: { options: readonly string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? "" : opt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>{initial ? "Editar veículo" : "Novo veículo"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* 1. Título */}
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              placeholder="Ex: Onix LT 1.0 2022"
            />
          </div>

          {/* 2. Preço */}
          <div className="space-y-1.5">
            <Label>Preço (R$)</Label>
            <Input
              type="number"
              value={form.preco || ""}
              onChange={(e) => update("preco", Number(e.target.value))}
              placeholder="Ex: 65900"
            />
          </div>

          {/* 3. Marca + Modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input
                value={meta.marca}
                onChange={(e) => updateMeta("marca", e.target.value)}
                placeholder="Ex: Chevrolet"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input
                value={meta.modelo}
                onChange={(e) => updateMeta("modelo", e.target.value)}
                placeholder="Ex: Onix"
              />
            </div>
          </div>

          {/* 4. Ano + KM */}
          <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Input
              inputMode="numeric"
              value={form.year ?? ""}
              onChange={(e) => update("year", e.target.value ? Number(e.target.value) : null)}
              placeholder="Ex: 2022"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quilometragem (km)</Label>
            <Input
              inputMode="numeric"
              value={form.km ?? ""}
              onChange={(e) => update("km", e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null)}
              placeholder="Ex: 32000"
            />
          </div>
          </div>

          {/* 5. Câmbio + Combustível */}
          <div className="space-y-1.5">
            <Label>Câmbio</Label>
            <SelectChips options={CAMBIOS} value={meta.cambio} onChange={(v) => updateMeta("cambio", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Combustível</Label>
            <SelectChips options={COMBUSTIVEIS} value={meta.combustivel} onChange={(v) => updateMeta("combustivel", v)} />
          </div>

          {/* 6. Carroceria + Cor */}
          <div className="space-y-1.5">
            <Label>Carroceria</Label>
            <SelectChips options={CARROCERIAS} value={meta.carroceria} onChange={(v) => updateMeta("carroceria", v)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <Input
              value={meta.cor}
              onChange={(e) => updateMeta("cor", e.target.value)}
              placeholder="Ex: Prata"
            />
          </div>

          {/* 7. Cidade */}
          <div className="space-y-1.5">
            <Label>Cidade / Região</Label>
            <Input
              value={form.city ?? ""}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Ex: São Paulo - SP"
            />
          </div>

          {/* 8. Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição do veículo</Label>
            <Textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Ex: Veículo em ótimo estado, revisado, único dono..."
            />
          </div>

          {/* 9. Fotos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Fotos do veículo
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  ({form.fotosUrls.length}/{MAX_PROPERTY_PHOTOS})
                </span>
              </Label>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              A primeira foto será usada como capa. Toque na estrela para definir.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {form.fotosUrls.map((url, idx) => (
                <div
                  key={url + idx}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl border bg-muted",
                    idx === 0 ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                >
                  <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-primary text-primary-foreground text-[9px] font-bold uppercase px-1.5 py-0.5">
                      Capa
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFoto(idx)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remover foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeCover(idx)}
                      className="absolute top-1 left-1 h-6 w-6 rounded-full bg-background/90 border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                      aria-label="Definir como capa"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {canAddMore && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border bg-card hover:bg-secondary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span className="text-[10px] font-medium">
                    {uploading ? "Enviando…" : "Adicionar"}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Vendido */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Marcar como Vendido</p>
              <p className="text-xs text-muted-foreground">
                Aparece em "Veículos Entregues" na página pública.
              </p>
            </div>
            <Switch
              checked={form.vendido}
              onCheckedChange={(v) => update("vendido", v)}
            />
          </div>

          <Button onClick={submit} className="w-full" size="lg" disabled={uploading}>
            {uploading ? "Carregando…" : "Salvar veículo"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
