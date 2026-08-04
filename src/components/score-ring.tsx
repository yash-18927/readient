import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/lib/analysis/schema";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

function toneColor(pct: number) {
  const tone = scoreTone(pct);
  return tone === "low" ? "var(--destructive)" : tone === "mid" ? "var(--warning)" : "var(--success)";
}

/** Short, soft interaction cue. Never throws, never blocks the interaction. */
function playCue() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
    }
  } catch {
    /* ignore */
  }
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => void ctx.close().catch(() => {});
  } catch {
    /* audio blocked — interaction continues */
  }
}

function Ring({
  value,
  size,
  stroke,
  color,
  children,
  delay = 0,
  animate = true,
  className,
}: {
  value: number;
  size: number;
  stroke: number;
  color: string;
  children?: React.ReactNode;
  delay?: number;
  animate?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const end = circumference * (1 - pct / 100);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          className={animate ? "animate-ring-fill" : undefined}
          style={
            {
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              "--ring-start": `${circumference}px`,
              "--ring-end": `${end}px`,
              strokeDashoffset: `${end}px`,
              animationDelay: `${delay}ms`,
            } as React.CSSProperties
          }
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      ) : null}
    </div>
  );
}

export type ScoreBreakdownItem = { label: string; value: number };

export function InteractiveScoreRing({
  score,
  breakdown,
  size = 420,
  className,
}: {
  score: number;
  breakdown: ScoreBreakdownItem[];
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const openWithCue = useCallback(() => {
    setOpen((prev) => {
      if (!prev) playCue();
      return true;
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) playCue();
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stroke = Math.max(6, Math.round(size / 42));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const end = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`Readiness score ${Math.round(score)} out of 100. Activate to see the breakdown.`}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") openWithCue();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setOpen(false);
        }}
        onClick={(e) => {
          // Hover already handles mouse; only tap/pen toggles.
          if ((e.nativeEvent as PointerEvent).pointerType === "mouse") return;
          toggle();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        className="mx-auto block w-full max-w-[26rem] cursor-pointer outline-none transition-transform duration-300 ease-out focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{ transform: open ? "scale(0.88)" : "scale(1)" }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className="animate-ring-fill"
            style={
              {
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                "--ring-start": `${circumference}px`,
                "--ring-end": `${end}px`,
                strokeDashoffset: `${end}px`,
              } as React.CSSProperties
            }
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            className="fill-foreground text-[3.4rem] font-normal tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {Math.round(score)}
          </text>
          <text x="50%" y="59%" textAnchor="middle" className="fill-muted-foreground text-[0.95rem] tracking-[0.18em]" style={MONO}>
            / 100
          </text>
        </svg>
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="min-h-0">
          <div className="mx-auto flex max-w-[26rem] flex-wrap justify-center gap-x-5 gap-y-4 pt-2">
            {open &&
              breakdown.map((item, i) => (
                <div key={item.label} className="flex w-[4.5rem] flex-col items-center gap-1.5">
                  <Ring
                    value={item.value}
                    size={52}
                    stroke={4}
                    color={toneColor(item.value)}
                    delay={i * 110}
                  >
                    <span className="text-[0.7rem] tabular-nums text-foreground">
                      {Math.round(item.value)}
                    </span>
                  </Ring>
                  <span
                    className="text-center text-[0.55rem] leading-tight tracking-[0.12em] text-muted-foreground"
                    style={MONO}
                  >
                    {item.label.toUpperCase()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
