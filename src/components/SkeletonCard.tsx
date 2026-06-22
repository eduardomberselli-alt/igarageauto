import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton card estilizado para listas de veículos / leads.
 * Mantém o mesmo formato dos cards reais para evitar layout shift.
 */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border shadow-[var(--shadow-card)]">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}
