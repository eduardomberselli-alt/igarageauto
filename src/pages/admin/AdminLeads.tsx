import { useMemo, useState } from "react";
import { Inbox, Building2, Clock, Phone, Mail, MessageCircle, CheckCircle2, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLeads } from "@/hooks/useAppData";

export default function AdminLeads() {
  const { leads, loading, markContacted, deleteLead } = useLeads({ all: true });
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "contacted">("all");

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((l) => {
      if (l.ownerId) map.set(l.ownerId, l.ownerName ?? "Sem nome");
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filterOwner !== "all" && l.ownerId !== filterOwner) return false;
      if (filterStatus === "pending" && l.contacted) return false;
      if (filterStatus === "contacted" && !l.contacted) return false;
      return true;
    });
  }, [leads, filterOwner, filterStatus]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const openWhatsApp = (phone: string, name: string, prop?: string) => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) return toast.error("Telefone inválido");
    const msg = encodeURIComponent(
      `Olá ${name}! Vi seu interesse${prop ? ` no veículo "${prop}"` : ""} e gostaria de conversar.`,
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Leads</h2>
        <p className="text-xs text-muted-foreground">
          Todos os contatos recebidos pela rede de lojistas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger>
            <SelectValue placeholder="Lojista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os lojistas</SelectItem>
            {owners.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="contacted">Contatados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum lead encontrado.</p>
        </div>
      )}

      {!loading &&
        filtered.map((l) => (
          <article
            key={l.id}
            className="rounded-2xl bg-card border border-border p-3 shadow-[var(--shadow-card)] space-y-2.5"
          >
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{l.name || "Sem nome"}</p>
                  {l.contacted ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      CONTATADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5">
                      PENDENTE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDate(l.createdAt)}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs pl-11">
              {l.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  {l.phone}
                </p>
              )}
              {l.email && (
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {l.email}
                </p>
              )}
              {l.propertyTitle && (
                <p className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  {l.propertyTitle}
                </p>
              )}
              {l.ownerName && (
                <p className="text-muted-foreground">
                  Lojista: <span className="text-foreground font-medium">{l.ownerName}</span>
                </p>
              )}
              {l.message && (
                <p className="text-muted-foreground italic line-clamp-2 mt-1">"{l.message}"</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              {l.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openWhatsApp(l.phone, l.name, l.propertyTitle)}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                variant={l.contacted ? "ghost" : "default"}
                className="flex-1"
                onClick={async () => {
                  const err = await markContacted(l.id, !l.contacted);
                  if (err) toast.error(err.message);
                  else toast.success(l.contacted ? "Marcado como pendente" : "Marcado como contatado");
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {l.contacted ? "Desmarcar" : "Contatado"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="shrink-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover lead?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O contato de {l.name || "este cliente"} será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const err = await deleteLead(l.id);
                        if (err) toast.error(err.message);
                        else toast.success("Lead removido");
                      }}
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </article>
        ))}
    </div>
  );
}
