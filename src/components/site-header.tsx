import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Home,
  Sparkles,
  FileSearch,
  History,
  Info,
  Shield,
  Scale,
  Mail,
  LifeBuoy,
  Menu,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const primaryNav = [
  { label: "Home", to: "/", icon: Home },
  { label: "Features", to: "/", hash: "features", icon: Sparkles },
  { label: "Analysis", to: "/student", icon: FileSearch },
  { label: "History", to: "/student", hash: "history", icon: History },
  { label: "About", to: "/", hash: "about", icon: Info },
] as const;

const secondaryNav = [
  { label: "Privacy Policy", to: "/privacy", icon: Shield },
  { label: "Terms of Service", to: "/terms", icon: Scale },
  { label: "Contact", to: "/contact", icon: Mail },
  { label: "Support", to: "/support", icon: LifeBuoy },
] as const;

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<Event | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return {
    canInstall: Boolean(deferred),
    install: async () => {
      const prompt = deferred as (Event & { prompt?: () => Promise<void> }) | null;
      await prompt?.prompt?.();
      setDeferred(null);
    },
  };
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { canInstall, install } = useInstallPrompt();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 sm:px-6 sm:py-4">
        <Link to="/" className="flex min-w-0 items-center" aria-label="Readient home">
          <Logo />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <nav className="mr-2 hidden items-center gap-6 lg:flex">
            {primaryNav.slice(0, 3).map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={"hash" in item ? item.hash : undefined}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {canInstall && (
            <Button
              variant="ghost"
              size="sm"
              onClick={install}
              className="h-9 rounded-full border border-border/70 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Download className="mr-1.5 size-3.5" /> Install App
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden h-9 px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <Link to="/auth">Sign in</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="size-10 rounded-xl shadow-soft transition-transform duration-200 hover:scale-[1.03]"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,88vw)] p-0">
              <SheetHeader className="border-b border-border/60 px-6 py-5">
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {primaryNav.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    hash={"hash" in item ? item.hash : undefined}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:translate-x-0.5 hover:bg-secondary"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="size-4" />
                    </span>
                    {item.label}
                  </Link>
                ))}

                <div className="my-3 h-px bg-border" />

                {secondaryNav.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-all duration-200 hover:translate-x-0.5 hover:bg-secondary hover:text-foreground"
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
