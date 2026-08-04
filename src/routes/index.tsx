import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { playIntroTransition } from "@/components/intro-transition";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroConstellation } from "@/components/hero-constellation";
import { CyclingWord } from "@/components/cycling-word";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Readient — Readiness isn't a guess. It's a number." },
      {
        name: "description",
        content:
          "Readient scores placement readiness out of 100 from your resume, skills and project evidence — then shows exactly what to fix next.",
      },
      { property: "og:title", content: "Readient — Readiness isn't a guess. It's a number." },
      {
        property: "og:description",
        content:
          "An AI readiness score out of 100 for students, built from resume, skills and project evidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const SCORE = 76;

const DEMO_BREAKDOWN = [
  { label: "ATS Compatibility", value: 82 },
  { label: "Resume Quality", value: 74 },
  { label: "Skill Match", value: 68 },
  { label: "Projects", value: 79 },
  { label: "Interview Readiness", value: 63 },
  { label: "GitHub Profile", value: 88 },
  { label: "Coding Profile", value: 71 },
];

function ScoreRing() {
  return <InteractiveScoreRing score={SCORE} breakdown={DEMO_BREAKDOWN} />;
}

function Landing() {
  const navigate = useNavigate();
  const router = useRouter();

  // Preload role selection as soon as the landing page mounts so it is ready
  // in the DOM the instant the wipe starts.
  useEffect(() => {
    void router.preloadRoute({ to: "/get-started" });
  }, [router]);

  return (
    <div className="landing-noir flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8 sm:pt-10">
        <span className="text-sm font-medium tracking-tight text-foreground">Readient</span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-20 sm:py-28">
        <div className="grid w-full items-center gap-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
              01 — SCORE
            </p>

            <h1 className="mt-10 text-4xl font-medium leading-[1.25] tracking-tight sm:text-5xl sm:leading-[1.22]">
              Readiness isn't
              <br />
              a guess.
              <br />
              It's a number.
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
              Readient reads your resume, skills and project evidence, then scores how close you
              are to being hired for the role you actually want.
            </p>

            <button
              type="button"
              onClick={() => playIntroTransition(() => navigate({ to: "/get-started" }))}
              className="mt-12 inline-block border-b border-primary pb-1 text-sm text-foreground transition-colors hover:text-primary"
            >
              Run your first scan →
            </button>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ScoreRing />
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8">
        <p className="text-xs text-muted-foreground">Created by Yash Vardhan Singh</p>
      </footer>
    </div>
  );
}
