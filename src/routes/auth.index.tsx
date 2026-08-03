import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/integrations/supabase/client";
import { dashboardPath, setPendingRole, waitForProfile, type AppRole } from "@/lib/auth";

const searchSchema = z.object({
  role: z.enum(["student", "recruiter"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  next: z.string().optional(),
});

/** Only same-origin relative paths may be used as a post-sign-in redirect. */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
}

export const Route = createFileRoute("/auth/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Readient" },
      { name: "description", content: "Sign in or create your Readient account." },
      { property: "og:title", content: "Sign in — Readient" },
      { property: "og:description", content: "Sign in or create your Readient account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role, mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const selectedRole: AppRole = role ?? "student";
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectTarget = safeNext(next);
  const callbackUrl = `${typeof window === "undefined" ? "" : window.location.origin}/auth/callback${
    redirectTarget ? `?next=${encodeURIComponent(redirectTarget)}` : ""
  }`;

  function goAfterAuth(resolvedRole: AppRole) {
    if (redirectTarget) {
      window.location.replace(redirectTarget);
      return;
    }
    navigate({ to: dashboardPath(resolvedRole) });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: { role: selectedRole, full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        const profile = await waitForProfile(data.user!.id);
        goAfterAuth(profile?.role ?? selectedRole);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await waitForProfile(data.user.id);
        goAfterAuth(profile?.role ?? "student");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setPendingRole(selectedRole);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  }

  const mono = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8 sm:pt-10">
        <Link to="/" className="text-sm font-medium tracking-tight text-foreground">
          Readient
        </Link>
        <Link
          to="/"
          className="inline-flex items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-2 size-3.5" /> Back
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-20 sm:py-24">
        <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={mono}>
          {tab === "signup" ? "02 — CREATE ACCOUNT" : "02 — SIGN IN"}
        </p>

        <h1 className="mt-8 text-3xl font-medium leading-[1.25] tracking-tight sm:text-4xl">
          {tab === "signup" ? (
            <>
              Start your
              <br />
              readiness file.
            </>
          ) : (
            <>
              Welcome
              <br />
              back.
            </>
          )}
        </h1>

        <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {tab === "signup"
            ? `You're signing up as a ${selectedRole}.`
            : "Sign in to reach your dashboard."}
        </p>

        <div className="mt-10 flex gap-6 border-b border-border">
          {(["signin", "signup"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={
                tab === value
                  ? "-mb-px border-b border-primary pb-3 text-sm text-foreground"
                  : "-mb-px border-b border-transparent pb-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {value === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-10 h-11 w-full justify-center gap-2 rounded-lg border-border bg-transparent text-sm font-normal hover:bg-secondary"
          disabled={busy}
          onClick={handleGoogle}
        >
          <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.6.28-3.15.77-4.59l-7.98-6.19A23.98 23.98 0 000 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {tab === "signup" ? "Sign up with Google" : "Continue with Google"}
        </Button>

        <div className="my-8 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[0.65rem] tracking-[0.28em] text-muted-foreground" style={mono}>
            OR
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {tab === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-normal text-muted-foreground">
                Full name
              </Label>
              <Input
                id="fullName"
                className="h-11 rounded-lg border-border bg-transparent"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 rounded-lg border-border bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={tab === "signup" ? "new-password" : "current-password"}
              minLength={6}
              className="h-11 rounded-lg border-border bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-lg text-sm" disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tab === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        {tab === "signup" && (
          <p className="mt-8 text-xs text-muted-foreground">
            Wrong role?{" "}
            <Link to="/get-started" className="border-b border-primary pb-0.5 text-foreground">
              Change it
            </Link>
          </p>
        )}
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8">
        <p className="text-xs text-muted-foreground">Created by Yash Vardhan Singh</p>
      </footer>
    </div>
  );
}

