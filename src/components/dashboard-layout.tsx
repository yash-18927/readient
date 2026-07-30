import type { ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/auth";

export type NavItem = { label: string; active?: boolean };

export function DashboardLayout({
  profile,
  signedIn = true,
  role,
  navItems,
  title,
  subtitle,
  children,
}: {
  profile: Profile | null;
  signedIn?: boolean;
  role?: AppRole;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-base font-bold">
              Readient
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className={
                    item.active
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {signedIn ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {profile?.full_name || "Account"} · {profile?.role}
                </span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth" search={{ role, mode: "signin" }}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ role, mode: "signup" }}>
                    Create account
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}

export function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
