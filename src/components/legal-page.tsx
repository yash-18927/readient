import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
          {title.toUpperCase()}
        </p>
        <h1 className="mt-6 text-4xl font-light tracking-tight">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>
        <div className="mt-12 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
        {heading.toUpperCase()}
      </p>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
