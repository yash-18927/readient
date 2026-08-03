import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { dashboardPath, setPendingRole, type AppRole } from "@/lib/auth";
import { introRevealDelay } from "@/components/intro-transition";

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

const steps = [
  { label: "Scan", caption: "Read the material", fill: "var(--warm-accent)" },
  { label: "Gaps", caption: "See what's missing", fill: "var(--warm-accent-soft)" },
  { label: "Apply", caption: "Move on the role", fill: "transparent" },
];

const options: { role: AppRole; title: string; body: string }[] = [
  {
    role: "student",
    title: "I'm a Student",
    body: "Analyse my resume, score my readiness and see what to improve next.",
  },
  {
    role: "recruiter",
    title: "I'm a Recruiter",
    body: "Post roles with AI assistance and rank incoming candidates automatically.",
  },
];

function PathVisual() {
  return (
    <div className="mt-14 flex items-start">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 items-start last:flex-none">
          <div className="flex w-24 shrink-0 flex-col items-center text-center">
            <span
              className="animate-step-in flex size-12 items-center justify-center rounded-full border-2 text-sm font-medium"
              style={{
                animationDelay: `${i * 150}ms`,
                backgroundColor: step.fill,
                borderColor: step.fill === "transparent" ? "var(--warm-accent-soft)" : step.fill,
                color: step.fill === "transparent" ? "var(--warm-accent)" : "#faf7f2",
              }}
            >
              {i + 1}
            </span>
            <span className="mt-3 text-sm font-medium">{step.label}</span>
            <span className="mt-1 text-xs" style={{ color: "var(--warm-muted)" }}>
              {step.caption}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              className="animate-fade-in mt-6 h-px flex-1"
              style={{ backgroundColor: "var(--warm-line)", animationDelay: `${i * 150 + 120}ms` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function GetStarted() {
  const navigate = useNavigate();
  // Content is mounted immediately but stays invisible until the wipe has
  // fully passed, then fades in — no load gap, no pop.
  const [hidden, setHidden] = useState(() => introRevealDelay() > 0);

  useEffect(() => {
    const delay = introRevealDelay();
    if (delay <= 0) {
      setHidden(false);
      return;
    }
    const t = window.setTimeout(() => setHidden(false), delay);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="role-warm flex min-h-screen flex-col">
      <div
        className={hidden ? "flex min-h-screen flex-col opacity-0" : "intro-reveal flex min-h-screen flex-col"}
      >
      <header className="mx-auto w-full max-w-3xl px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--warm-muted)" }}
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24">
        <p
          className="font-mono text-xs tracking-[0.2em] uppercase"
          style={{ color: "var(--warm-eyebrow)" }}
        >
          From resume to role
        </p>
        <h1 className="mt-5 max-w-xl text-4xl leading-[1.15] font-medium sm:text-5xl">
          Three stops between you and the offer.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed" style={{ color: "var(--warm-muted)" }}>
          Whether you&apos;re preparing for placements or hiring for them, the path is the same
          — see clearly, close the gaps, then make the move.
        </p>

        <PathVisual />

        <div className="mt-20 grid gap-4 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.role}
              type="button"
              onClick={() => {
                setPendingRole(option.role);
                navigate({ to: dashboardPath(option.role) });
              }}
              className="rounded-3xl border p-7 text-left transition-colors"
              style={{ borderColor: "var(--warm-line)", backgroundColor: "#fffdfa" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--warm-accent-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--warm-line)")}
            >
              <h2 className="text-lg font-medium">{option.title}</h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--warm-muted)" }}>
                {option.body}
              </p>
              <span
                className="mt-6 inline-block text-sm font-medium"
                style={{ color: "var(--warm-accent)" }}
              >
                Continue →
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
