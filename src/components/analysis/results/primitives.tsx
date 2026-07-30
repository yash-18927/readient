import { cn } from "@/lib/utils";
import { TONE_BAR, scoreTone } from "@/lib/analysis/schema";

export function ScoreBar({
  label,
  value,
  max = 100,
  suffix,
}: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {Math.round(value)}
          {suffix ?? (max === 100 ? "" : `/${max}`)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", TONE_BAR[scoreTone(pct)])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Chip({ tone, children }: { tone: "green" | "red" | "yellow" | "neutral"; children: React.ReactNode }) {
  const styles = {
    green: "bg-success/12 text-success border-success/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
    yellow: "bg-warning/15 text-warning-foreground border-warning/40",
    neutral: "bg-muted text-muted-foreground border-border",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", styles)}>
      {children}
    </span>
  );
}

export function Gauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = scoreTone(pct);
  const color = tone === "low" ? "var(--destructive)" : tone === "mid" ? "var(--warning)" : "var(--success)";
  return (
    <div
      className="relative grid size-36 place-items-center rounded-full"
      style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, var(--muted) 0deg)` }}
    >
      <div className="grid size-28 place-items-center rounded-full bg-card">
        <span className="text-3xl font-bold tabular-nums">{Math.round(pct)}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function BulletList({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty ?? "Nothing flagged."}</p>;
  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
