import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPath, setPendingRole, waitForProfile, type AppRole } from "@/lib/auth";

const searchSchema = z.object({
  role: z.enum(["student", "recruiter"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — PlacementIQ" },
      { name: "description", content: "Sign in or create your PlacementIQ account." },
      { property: "og:title", content: "Sign in — PlacementIQ" },
      { property: "og:description", content: "Sign in or create your PlacementIQ account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role, mode } = Route.useSearch();
  const navigate = useNavigate();
  const selectedRole: AppRole = role ?? "student";
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { role: selectedRole, full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        const profile = await waitForProfile(data.user!.id);
        navigate({ to: dashboardPath(profile?.role ?? selectedRole) });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const profile = await waitForProfile(data.user.id);
        navigate({ to: dashboardPath(profile?.role ?? "student") });
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-md px-6 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-md px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <h1 className="text-2xl font-bold">
            {tab === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "signup"
              ? `You're signing up as a ${selectedRole}.`
              : "Sign in to reach your dashboard."}
          </p>

          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "signin" | "signup")}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            disabled={busy}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {tab === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
              {tab === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          {tab === "signup" && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Wrong role?{" "}
              <Link to="/get-started" className="text-primary underline">
                Change it
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
