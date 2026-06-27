import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onlyDigits } from "@/lib/format";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  whatsapp?: string;
  vehicleTitle: string;
  vehicleYear?: string | null;
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
function maskDate(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, "$1/$2").replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}
function maskBRL(v: string) {
  const d = onlyDigits(v);
  if (!d) return "";
  const n = parseInt(d, 10);
  return n.toLocaleString("pt-BR");
}

export function FinancingModal({ open, onOpenChange, whatsapp, vehicleTitle, vehicleYear }: Props) {
  const [cpf, setCpf] = useState("");
  const [data, setData] = useState("");
  const [entrada, setEntrada] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onlyDigits(cpf).length !== 11) {
      toast({ title: "CPF inválido", description: "Informe os 11 dígitos do CPF." });
      return;
    }
    if (onlyDigits(data).length !== 8) {
      toast({ title: "Data inválida", description: "Use o formato DD/MM/AAAA." });
      return;
    }
    if (!entrada) {
      toast({ title: "Informe o valor de entrada" });
      return;
    }
    const digits = whatsapp ? onlyDigits(whatsapp) : "";
    if (!digits) {
      toast({ title: "WhatsApp da loja indisponível" });
      return;
    }
    const ano = vehicleYear ? ` ${vehicleYear}` : "";
    const message =
      `Olá! Gostaria de fazer uma simulação de financiamento para o veículo *${vehicleTitle}${ano}*.\n\n` +
      `Seguem os dados para a análise de crédito:\n` +
      `- *CPF:* ${cpf}\n` +
      `- *Data de Nasc.:* ${data}\n` +
      `- *Valor de Entrada:* R$ ${entrada}`;
    const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Simulação de Financiamento</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para receber uma pré-análise do banco parceiro.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="fin-cpf">CPF</Label>
            <Input
              id="fin-cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin-data">Data de Nascimento</Label>
            <Input
              id="fin-data"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={data}
              onChange={(e) => setData(maskDate(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fin-entrada">Valor de Entrada Pretendido (R$)</Label>
            <Input
              id="fin-entrada"
              inputMode="numeric"
              placeholder="0"
              value={entrada}
              onChange={(e) => setEntrada(maskBRL(e.target.value))}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 bg-[#25D366] hover:bg-[#1faa54] text-white font-bold"
          >
            Enviar Simulação por WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}