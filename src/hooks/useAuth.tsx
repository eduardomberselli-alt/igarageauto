import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "corretor";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: Role | null;
  loading: boolean;
  isAdmin: boolean;
  /** Status da loja do usuário atual: 'active' (padrão), 'suspended' ou null se ainda carregando. */
  profileStatus: "active" | "suspended" | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profileStatus, setProfileStatus] = useState<"active" | "suspended" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener primeiro
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer para evitar deadlock
        setTimeout(() => {
          fetchRole(s.user.id);
          fetchStatus(s.user.id);
        }, 0);
      } else {
        setRole(null);
        setProfileStatus(null);
      }
    });

    // Depois sessão atual
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchRole(s.user.id);
        fetchStatus(s.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (data && data.length > 0) {
      const isAdmin = data.some((r) => r.role === "admin");
      setRole(isAdmin ? "admin" : "corretor");
    } else {
      setRole("corretor");
    }
  };

  const fetchStatus = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    setProfileStatus(((data as any)?.status ?? "active") as "active" | "suspended");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setProfileStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        isAdmin: role === "admin",
        profileStatus,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
