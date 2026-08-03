import { useEffect, useState } from "react";

/**
 * One-time "paper plane curtain" page transition.
 *
 * Isolated from any page component: pages only call `playIntroTransition()`,
 * the overlay itself is mounted once in the root route.
 */

const EVENT = "readient:intro-transition";
export const INTRO_TOTAL_MS = 1500;
const NAVIGATE_AT_MS = 780;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Plays the curtain transition every time, navigating once the screen is
 * fully covered. Reduced-motion users navigate instantly.
 */
export function playIntroTransition(navigate: () => void) {
  if (prefersReducedMotion()) {
    navigate();
    return;
  }
  window.dispatchEvent(new CustomEvent(EVENT));
  window.setTimeout(navigate, NAVIGATE_AT_MS);
}

function PaperPlane() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-10"
      aria-hidden="true"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

export function IntroTransition() {
  const [runId, setRunId] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onPlay = () => {
      setRunId((n) => n + 1);
      setPlaying(true);
    };
    window.addEventListener(EVENT, onPlay);
    return () => window.removeEventListener(EVENT, onPlay);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setPlaying(false), INTRO_TOTAL_MS + 80);
    return () => window.clearTimeout(t);
  }, [playing, runId]);

  if (!playing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <div key={runId} className="intro-curtain absolute inset-y-0 left-0 w-screen">
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 rotate-[18deg]"
          style={{ color: "#d85a30" }}
        >
          <PaperPlane />
        </div>
      </div>
    </div>
  );
}
