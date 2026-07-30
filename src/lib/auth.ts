import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const PENDING_ROLE_KEY = "apr.pending_role";

export function setPendingRole(role: AppRole) {
  if (typeof window !== "undefined") window.localStorage.setItem(PENDING_ROLE_KEY, role);
}

export function takePendingRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(PENDING_ROLE_KEY);
  window.localStorage.removeItem(PENDING_ROLE_KEY);
  return value === "student" || value === "recruiter" ? value : null;
}

export function dashboardPath(role: AppRole) {
  return role === "recruiter" ? "/recruiter" : "/student";
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Waits for the profile row created by the signup trigger. */
export async function waitForProfile(userId: string, attempts = 8): Promise<Profile | null> {
  for (let i = 0; i < attempts; i++) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  });
}
