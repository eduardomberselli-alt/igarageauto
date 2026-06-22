import { Outlet, NavLink, Link } from "react-router-dom";
import { Users, GraduationCap, Inbox, ArrowLeft, LogOut, BookOpen, Store, LayoutDashboard, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const adminTabs = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/lojas", label: "Lojas", icon: Store },
  { to: "/admin/lojistas", label: "Lojistas", icon: Users },
  { to: "/admin/leads", label: "Leads", icon: Inbox },
  { to: "/admin/conhecimento", label: "Conhecimento", icon: BookOpen },
  { to: "/admin/aulas", label: "Aulas", icon: GraduationCap },
];

export function AdminLayout() {
  const { signOut } = useAuth();
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="px-4 py-3 flex items-center gap-2">
          <Link to="/" className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-semibold leading-tight">Admin · Garage</h1>
              <p className="text-[11px] text-muted-foreground">Painel administrativo</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
        <nav className="px-2 pb-2 flex gap-1 overflow-x-auto">
          {adminTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground",
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="pb-12">
        <Outlet />
      </main>
    </div>
  );
}
