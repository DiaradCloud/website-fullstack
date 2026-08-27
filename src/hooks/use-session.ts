import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { clearStaleSession, isStaleSessionError } from "@/lib/auth-recovery";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string;
  username: string | null;
  first_name: string;
  last_name: string;
  national_id: string | null;
  phone: string | null;
  birth_date: string | null;
  city: string | null;
  network_name: string | null;
  credit: number;
  created_at: string;
};

export type SessionState = {
  user: User | null;
  profile: Profile | null;
  roles: string[];
  isStaff: boolean;
  isAdmin: boolean;
};

export const sessionQueryKey = ["session"] as const;

const LOGGED_OUT_STATE: SessionState = { user: null, profile: null, roles: [], isStaff: false, isAdmin: false };

export async function loadSession(): Promise<SessionState> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // A rotated signing key or revoked session leaves a token the server can
    // never verify again. Drop it locally instead of leaving the UI stuck in
    // a half-signed-in state where every action fails silently.
    if (isStaleSessionError(error)) {
      console.error("[v0] Stale session detected, signing out:", error.message);
      await clearStaleSession();
    }
    return LOGGED_OUT_STATE;
  }
  const user = data.user ?? null;
  if (!user) return LOGGED_OUT_STATE;

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role as string);
  const profileData = (profile as (Profile & { account_locked?: boolean }) | null) ?? null;
  if (profileData?.account_locked) {
    await supabase.auth.signOut();
    return { user: null, profile: null, roles: [], isStaff: false, isAdmin: false };
  }

  return {
    user,
    profile: profileData,
    roles,
    isStaff: roles.includes("admin") || roles.includes("support"),
    isAdmin: roles.includes("admin"),
  };
}

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: loadSession,
    staleTime: 30_000,
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  };
}
