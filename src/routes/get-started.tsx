import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dashboardPath, setPendingRole, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Choose your role — Readient" },
      { name: "description", content: "Join Readient as a student or as a recruiter." },
      { property: "og:title", content: "Choose your role — Readient" },
      { property: "og:description", content: "Join Readient as a student or as a recruiter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GetStarted,
});

const options: { role: AppRole; icon: typeof GraduationCap; title: string; body: string }[] = [
  {
    role: "student",
    icon: GraduationCap,
    title: "I'm a Student",
    body: "Analyse my resume, score my readiness and see what to improve next.",
  },
  {
    role: "recruiter",
    icon: Briefcase,
    title: "I'm a Recruiter",
    body: "Post roles with AI assistance and rank incoming candidates automatically.",
  },
];

function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-6 pb-24">
        <h1 className="text-3xl font-bold sm:text-4xl">How will you use Readient?</h1>
        <p className="mt-3 text-muted-foreground">
          Pick one to open your workspace — you&apos;ll only need an account when you run an analysis.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.role}
              type="button"
              onClick={() => {
                setPendingRole(option.role);
                navigate({ to: dashboardPath(option.role) });
              }}
              className="group rounded-2xl border border-border bg-card p-8 text-left shadow-soft transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lift"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <option.icon className="size-6" />
              </div>
              <h2 className="mt-6 text-xl font-semibold">{option.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{option.body}</p>
              <span className="mt-6 inline-block text-sm font-medium text-primary">Continue →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
