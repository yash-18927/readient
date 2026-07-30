import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPath, takePendingRole, waitForProfile } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — PlacementIQ" },
      { name: "description", content: "Completing your PlacementIQ sign-in." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Signing you in — PlacementIQ" },
      { property: "og:description", content: "Completing your PlacementIQ sign-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      // The Supabase client parses the OAuth/magic-link response in the URL
      // (detectSessionInUrl) and persists the session before this resolves.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && !(await supabase.auth.getSession()).data.session) {
          if (!cancelled) setError(exchangeError.message);
          return;
        }
      }

      let session = (await supabase.auth.getSession()).data.session;
      for (let i = 0; !session && i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        session = (await supabase.auth.getSession()).data.session;
      }

      if (!session) {
        if (!cancelled) setError("We couldn't complete sign-in. Please try again.");
        return;
      }

      const pendingRole = takePendingRole();
      let profile = await waitForProfile(session.user.id);

      if (pendingRole && profile && profile.role !== pendingRole) {
        const { data } = await supabase
          .from("profiles")
          .update({ role: pendingRole })
          .eq("user_id", session.user.id)
          .select()
          .maybeSingle();
        if (data) profile = data;
      }

      if (!cancelled) navigate({ to: dashboardPath(profile?.role ?? pendingRole ?? "student") });
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      {error ? (
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold">Sign-in failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <a href="/auth" className="mt-6 inline-block text-sm font-medium text-primary underline">
            Back to sign in
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm">Signing you in…</span>
        </div>
      )}
    </div>
  );
}
