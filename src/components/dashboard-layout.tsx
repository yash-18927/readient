import type { ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
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
      <header className="border-b border-border bg-background no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-sm font-medium tracking-tight text-foreground">
              Readient
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className={
                    item.active
                      ? "border-b border-primary pb-0.5 text-sm text-foreground"
                      : "border-b border-transparent pb-0.5 text-sm text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {signedIn ? (
              <>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {profile?.full_name || "Account"} · {profile?.role}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="rounded-lg">
                  <Link to="/auth" search={{ role, mode: "signin" }}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-lg">
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
        <p
          className="text-[0.7rem] tracking-[0.28em] text-muted-foreground"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
        >
          {(role ?? profile?.role ?? "").toString().toUpperCase() || "DASHBOARD"}
        </p>
        <h1 className="mt-6 text-3xl font-medium leading-[1.25] tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}

export function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-transparent p-12">
      <h2 className="text-base font-medium tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

