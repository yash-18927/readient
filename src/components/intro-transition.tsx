import { useEffect, useState } from "react";

/**
 * One-time "paper plane wipe" page transition.
 *
 * Isolated from any page component: pages only call `playIntroTransition()`,
 * the overlay itself is mounted once in the root route.
 *
 * Timeline (total = INTRO_TOTAL_MS):
 *   0ms .......... panel enters from the left
 *   COVER_AT_MS .. viewport fully covered -> navigation happens here
 *   TOTAL ........ panel has exited right, destination content fades in
 */

const EVENT = "readient:intro-transition";
const SESSION_KEY = "hasSeenIntroTransition";

export const INTRO_TOTAL_MS = 1400;
const COVER_AT_MS = 700;
const CONTENT_FADE_MS = 350;

declare global {
  interface Window {
    __readientIntroRevealAt?: number;
  }
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * How long the destination page should stay hidden before fading in,
 * or 0 when no transition is running.
 */
export function introRevealDelay() {
  if (typeof window === "undefined") return 0;
  const at = window.__readientIntroRevealAt;
  if (!at) return 0;
  return Math.max(0, at - Date.now());
}

export const INTRO_CONTENT_FADE_MS = CONTENT_FADE_MS;

/**
 * Plays the wipe on every click, navigating at the moment the screen is
 * fully covered. Reduced-motion users navigate instantly.
 */
export function playIntroTransition(navigate: () => void) {
  if (typeof window === "undefined" || prefersReducedMotion()) {
    navigate();
    return;
  }

  window.__readientIntroRevealAt = Date.now() + INTRO_TOTAL_MS;
  window.dispatchEvent(new CustomEvent(EVENT));
  window.setTimeout(navigate, COVER_AT_MS);
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
      className="size-9 sm:size-10"
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
    const t = window.setTimeout(() => {
      setPlaying(false);
      window.__readientIntroRevealAt = undefined;
    }, INTRO_TOTAL_MS);
    return () => window.clearTimeout(t);
  }, [playing, runId]);

  if (!playing) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
      <div key={runId} className="intro-curtain absolute inset-y-0 left-0 w-full">
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
