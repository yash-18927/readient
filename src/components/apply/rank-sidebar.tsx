import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight } from "lucide-react";
import { getJobStandings, type StandingRow } from "@/lib/public-jobs.functions";
import { cn } from "@/lib/utils";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

function ordinal(n: number) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Collapsible standings panel for an anonymous candidate on a shared job link.
 * Shows the full applicant list; on open it smooth-scrolls the student's own
 * row into the middle of the viewport.
 */
export function RankSidebar({ slug, score }: { slug: string; score: number }) {
  const standingsFn = useServerFn(getJobStandings);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<StandingRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const ownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    standingsFn({ data: { slug } })
      .then((res) => active && setRows(res.rows))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [standingsFn, slug]);

  const ownRank = rows ? rows.filter((r) => r.score > score).length + 1 : null;

  useEffect(() => {
    if (!open || !rows || !ownRef.current) return;
    const id = window.setTimeout(() => {
      ownRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 320);
    return () => window.clearTimeout(id);
  }, [open, rows]);

  return (
    <aside className="fixed right-0 top-1/4 z-30 flex items-start">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-l-lg border border-r-0 border-border bg-background px-3 py-3 text-[0.65rem] tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        style={MONO}
      >
        <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        <span>STANDINGS</span>
        <span className="rounded border border-primary/40 px-1 py-px text-[0.55rem] text-primary">
          BETA
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden border-y border-l border-border bg-background transition-all duration-300",
          open ? "w-64 px-5 py-4 opacity-100" : "w-0 border-0 px-0 py-0 opacity-0",
        )}
      >
        {failed || !rows ? (
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {failed ? "Standings unavailable." : "Loading…"}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between whitespace-nowrap">
              <p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground" style={MONO}>
                ALL APPLICANTS
              </p>
              {ownRank && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  You: {ordinal(ownRank)} of {rows.length}
                </p>
              )}
            </div>

            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto border-t border-border pt-2"
            >
              {rows.map((row) => {
                const isOwn = row.rank === ownRank;
                return (
                  <div
                    key={`${row.rank}-${row.name}`}
                    ref={isOwn ? ownRef : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded px-2 py-1.5 text-sm",
                      isOwn ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums" style={MONO}>
                      {row.rank}
                    </span>
                    <span className="flex-1 truncate">{isOwn ? "You" : row.name}</span>
                    <span className="shrink-0 tabular-nums">{row.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
