import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { onlyDigits } from "@/lib/format";
import { MessageCircle } from "lucide-react";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(8, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export interface LeadCaptureFormProps {
  /** UUID do corretor dono (broker_id) */
  brokerId: string;
  /** Telefone WhatsApp do corretor (com DDD/país) */
  brokerWhatsapp?: string | null;
  /** UUID do imóvel (opcional — quando o lead vem da landing de um imóvel) */
  propertyId?: string;
  /** Título do imóvel para mensagem WhatsApp pré-formatada */
  propertyTitle?: string;
  /** Texto do botão */
  ctaLabel?: string;
  /** Variante visual */
  compact?: boolean;
  /** Callback ao salvar com sucesso */
  onSuccess?: () => void;
}

export function LeadCaptureForm({
  brokerId,
  brokerWhatsapp,
  propertyId,
  propertyTitle,
  ctaLabel = "Quero falar com o lojista",
  compact = false,
  onSuccess,
}: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ name, phone, email, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);

    // 1) Salva o lead
    const { error } = await supabase.from("leads").insert({
      owner_id: brokerId,
      property_id: propertyId ?? null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message || null,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });

    if (error) {
      setBusy(false);
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }

    // 2) Notificação para o corretor (best-effort, não bloqueia)
    supabase.functions
      .invoke("notify-broker-lead", {
        body: {
          brokerId,
          propertyId: propertyId ?? null,
          propertyTitle: propertyTitle ?? null,
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || null,
          message: parsed.data.message || null,
        },
      })
      .catch(() => { /* silencioso — lead já está salvo */ });

    // 3) Abre WhatsApp com mensagem pré-formatada
    if (brokerWhatsapp) {
      const waMsg = encodeURIComponent(
        `Olá! Sou ${parsed.data.name}.\n` +
        `Vi ${propertyTitle ? `o veículo "${propertyTitle}"` : "seu portfólio"} no Garage e gostaria de mais informações.\n` +
        `Telefone: ${parsed.data.phone}` +
        (parsed.data.email ? `\nEmail: ${parsed.data.email}` : "") +
        (parsed.data.message ? `\n\n${parsed.data.message}` : "")
      );
      const url = `https://wa.me/${onlyDigits(brokerWhatsapp)}?text=${waMsg}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }

    toast.success("Mensagem enviada! O lojista entrará em contato.");
    setName(""); setPhone(""); setEmail(""); setMessage("");
    setBusy(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="space-y-1">
        <Label htmlFor="lc-name">Nome *</Label>
        <Input id="lc-name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="lc-phone">Telefone / WhatsApp *</Label>
        <Input id="lc-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999" required />
      </div>
      {!compact && (
        <div className="space-y-1">
          <Label htmlFor="lc-email">Email (opcional)</Label>
          <Input id="lc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" />
        </div>
      )}
      {!compact && (
        <div className="space-y-1">
          <Label htmlFor="lc-msg">Mensagem (opcional)</Label>
          <Textarea id="lc-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Tenho interesse em agendar uma visita…" />
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        <MessageCircle className="h-4 w-4" />
        {busy ? "Enviando…" : ctaLabel}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Seus dados são enviados apenas para o lojista.
      </p>
    </form>
  );
}
