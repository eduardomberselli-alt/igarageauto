import { MessageCircle, Phone, Mail, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonListItem } from "@/components/SkeletonCard";
import { useLeads } from "@/hooks/useAppData";
import { useAdminView } from "@/contexts/AdminViewContext";
import { onlyDigits } from "@/lib/format";

export default function Leads() {
  const { viewingStoreId } = useAdminView();
  const { leads, loading, markContacted, deleteLead } = useLeads({ ownerId: viewingStoreId ?? undefined });

  return (
    <div className="px-4 pt-6 pb-24">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">Interações de clientes interessados nos seus veículos.</p>
      </header>

      {loading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((i) => <SkeletonListItem key={i} />)}
        </ul>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold">Nenhum lead ainda</p>
          <p className="text-xs text-muted-foreground mt-1">
            Quando clientes clicarem no WhatsApp dos seus veículos, eles aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => {
            const wa = onlyDigits(lead.phone);
            return (
              <li
                key={lead.id}
                className="rounded-2xl border border-border bg-card p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{lead.name || "Sem nome"}</p>
                    {lead.propertyTitle && (
                      <p className="text-xs text-muted-foreground truncate">{lead.propertyTitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-foreground/80">
                  {lead.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </span>
                  )}
                  {lead.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {lead.email}
                    </span>
                  )}
                </div>

                {lead.message && (
                  <p className="text-sm text-foreground/90 bg-secondary/40 rounded-lg p-2">{lead.message}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {wa && (
                    <Button asChild size="sm" variant="default">
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={lead.contacted ? "secondary" : "outline"}
                    onClick={() => markContacted(lead.id, !lead.contacted)}
                  >
                    {lead.contacted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Contatado
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4" /> Marcar contatado
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Excluir este lead?")) deleteLead(lead.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
