import { cn } from "@/lib/utils";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

const BUCKETS = [
  { label: "0–19", min: 0, max: 19 },
  { label: "20–39", min: 20, max: 39 },
  { label: "40–59", min: 40, max: 59 },
  { label: "60–79", min: 60, max: 79 },
  { label: "80–100", min: 80, max: 100 },
];

export function JobAnalytics({ scores }: { scores: number[] }) {
  const total = scores.length;
  const average = total ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0;
  const top = total ? Math.max(...scores) : 0;
  const counts = BUCKETS.map((b) => scores.filter((s) => s >= b.min && s <= b.max).length);
  const peak = Math.max(1, ...counts);

  return (
    <section className="border-t border-border pt-8">
      <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
        APPLICANT ANALYTICS
      </p>

      <div className="mt-6 space-y-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Applicants", value: total },
            { label: "Average score", value: average },
            { label: "Top score", value: top },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border p-4">
              <p className="text-2xl font-light tabular-nums">{stat.value}</p>
              <p className="mt-1 text-[0.65rem] tracking-[0.22em] text-muted-foreground" style={MONO}>
                {stat.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        <div className="flex h-40 items-end gap-3">
          {BUCKETS.map((bucket, index) => (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{counts[index]}</span>
              <div
                className={cn("w-full rounded-t-sm bg-primary/80", counts[index] === 0 && "bg-border")}
                style={{ height: `${(counts[index] / peak) * 100}%`, minHeight: 4 }}
              />
              <span className="text-[0.65rem] text-muted-foreground" style={MONO}>
                {bucket.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
