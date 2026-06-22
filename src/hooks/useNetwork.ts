import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type Invite = {
  id: string;
  code: string;
  inviter_id: string;
  invitee_email: string | null;
  invitee_user_id: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  note: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

export type NetworkRow = {
  id: string;
  sponsor_id: string;
  invited_id: string;
  invite_id: string | null;
  created_at: string;
};

function genCode() {
  // Código curto, legível: 8 chars alfanuméricos
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 8; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export function useInvites() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: ["invites", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("inviter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });

  const quotaQuery = useQuery({
    queryKey: ["invite-quota", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: quota }, { data: remaining }] = await Promise.all([
        supabase.rpc("get_invite_quota", { _user_id: user!.id }),
        supabase.rpc("get_invites_remaining", { _user_id: user!.id }),
      ]);
      return {
        quota: (quota as number) ?? 3,
        remaining: (remaining as number) ?? 0,
      };
    },
  });

  const createInvite = useMutation({
    mutationFn: async (input: { email?: string; note?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("invites")
        .insert({
          code: genCode(),
          inviter_id: user.id,
          invitee_email: input.email || null,
          note: input.note ?? "",
        })
        .select()
        .single();
      if (error) throw error;
      return data as Invite;
    },
    onSuccess: () => {
      toast.success("Convite gerado");
      qc.invalidateQueries({ queryKey: ["invites", user?.id] });
      qc.invalidateQueries({ queryKey: ["invite-quota", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite revogado");
      qc.invalidateQueries({ queryKey: ["invites", user?.id] });
      qc.invalidateQueries({ queryKey: ["invite-quota", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { invitesQuery, quotaQuery, createInvite, revokeInvite };
}

export function useMyNetwork() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-network", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Quem eu convidei (já registrado)
      const { data: invitedRows, error: e1 } = await supabase
        .from("network_relationships")
        .select("*")
        .eq("sponsor_id", user!.id);
      if (e1) throw e1;

      const invitedIds = (invitedRows ?? []).map((r) => r.invited_id);
      let profiles: { user_id: string; nome: string; foto_url: string }[] = [];
      if (invitedIds.length > 0) {
        const { data: p } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url")
          .in("user_id", invitedIds);
        profiles = p ?? [];
      }

      // Quem me convidou
      const { data: sponsorRow } = await supabase
        .from("network_relationships")
        .select("*")
        .eq("invited_id", user!.id)
        .maybeSingle();

      let sponsor: { user_id: string; nome: string; foto_url: string } | null = null;
      if (sponsorRow?.sponsor_id) {
        const { data: sp } = await supabase
          .from("profiles")
          .select("user_id, nome, foto_url")
          .eq("user_id", sponsorRow.sponsor_id)
          .maybeSingle();
        sponsor = sp ?? null;
      }

      return {
        invited: (invitedRows ?? []).map((r) => ({
          ...r,
          profile: profiles.find((p) => p.user_id === r.invited_id) ?? null,
        })),
        sponsor,
      };
    },
  });
}
