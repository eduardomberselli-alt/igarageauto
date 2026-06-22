import { useNavigate } from "react-router-dom";
import { Eye, LogOut } from "lucide-react";
import { useAdminView } from "@/contexts/AdminViewContext";
import { Button } from "@/components/ui/button";

export function AdminViewBanner() {
  const { isViewingOtherStore, viewingStoreName, exitStore } = useAdminView();
  const navigate = useNavigate();
  if (!isViewingOtherStore) return null;

  const handleExit = () => {
    exitStore();
    navigate("/admin/lojas");
  };

  return (
    <div className="sticky top-0 z-40 bg-amber-500/15 border-b border-amber-500/40 backdrop-blur-md">
      <div className="px-4 py-2 flex items-center gap-3">
        <Eye className="h-4 w-4 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-amber-500/80 leading-none">
            Visualizando loja
          </p>
          <p className="text-sm font-semibold truncate">{viewingStoreName ?? "Loja"}</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExit} className="shrink-0">
          <LogOut className="h-3.5 w-3.5" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
