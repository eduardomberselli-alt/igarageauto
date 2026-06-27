export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/**
 * Aplica máscara visual de WhatsApp BR: (99) 99999-9999.
 * Aceita até 11 dígitos (DDD + 9 dígitos). Ignora prefixo 55 se digitado.
 */
export const formatWhatsAppMask = (s: string) => {
  let d = onlyDigits(s);
  // Se vier com prefixo 55 (13 dígitos), remove para exibir apenas DDD+número
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/**
 * Normaliza o WhatsApp para o formato aceito pela API (apenas dígitos com prefixo 55).
 * Idempotente: se já vier com 55, não duplica.
 */
export const normalizeWhatsAppBR = (s: string) => {
  const d = onlyDigits(s);
  if (!d) return "";
  if (d.startsWith("55") && d.length >= 12) return d;
  return `55${d}`;
};
