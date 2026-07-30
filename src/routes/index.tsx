import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, FileSearch, Sparkles, Target, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Placement Readiness Platform — Get hired, hire faster" },
      {
        name: "description",
        content:
          "AI-powered resume and readiness analysis for students, plus AI job posting and candidate ranking for recruiters.",
      },
      { property: "og:title", content: "AI Placement Readiness Platform" },
      {
        property: "og:description",
        content:
          "AI-powered readiness analysis for students and AI candidate ranking for recruiters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const studentSteps = [
  { icon: FileSearch, title: "Share your profile", body: "Add your resume and target roles." },
  { icon: BrainCircuit, title: "Get an AI readiness read", body: "See skill gaps scored against real job requirements." },
  { icon: Target, title: "Close the gaps", body: "Follow focused guidance until you're placement ready." },
];

const recruiterSteps = [
  { icon: Sparkles, title: "Post a role with AI", body: "Turn a rough brief into a structured job posting." },
  { icon: Users2, title: "Rank candidates", body: "Applicants are scored against the role automatically." },
  { icon: Target, title: "Shortlist with evidence", body: "Every ranking comes with a reason you can defend." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight">
          Readient
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="overflow-hidden rounded-3xl bg-hero-gradient px-8 py-20 text-surface-foreground shadow-lift sm:px-16">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-foreground/20 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            AI Placement Readiness Platform
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            Know exactly how placement ready you are.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-surface-foreground/80 sm:text-lg">
            Students get AI-powered resume and readiness analysis that scores their profile against
            real hiring expectations. Recruiters get AI-assisted job posting and automatic candidate
            ranking, so the right shortlist surfaces in minutes instead of weeks.
          </p>
          <div className="mt-10">
            <Button asChild size="lg" variant="secondary">
              <Link to="/get-started">
                Get Started <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-3xl font-bold">How it works</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          One platform, two very different jobs to be done.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <AudienceCard title="For students" caption="Turn a resume into a plan" steps={studentSteps} />
          <AudienceCard title="For recruiters" caption="Turn applicants into a shortlist" steps={recruiterSteps} />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display font-semibold text-foreground">Readient</span>
          <span>© {new Date().getFullYear()} Readient. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

function AudienceCard({
  title,
  caption,
  steps,
}: {
  title: string;
  caption: string;
  steps: { icon: typeof Target; title: string; body: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      <ol className="mt-8 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <step.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
