import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Trophy } from "lucide-react";
import { getApplicantRank, type ApplicantRank } from "@/lib/public-jobs.functions";
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
 * Lightweight, collapsible standings panel shown to an anonymous candidate
 * after they submit on a shared job link. Collapsed by default.
 */
export function RankSidebar({ slug, score }: { slug: string; score: number }) {
  const rankFn = useServerFn(getApplicantRank);
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ApplicantRank | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    rankFn({ data: { slug, score } })
      .then((res) => active && setData(res))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [rankFn, slug, score]);

  return (
    <aside className="fixed right-0 top-1/3 z-30 flex items-start">
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
          open ? "w-60 px-5 py-4 opacity-100" : "w-0 border-0 px-0 py-0 opacity-0",
        )}
      >
        {failed || !data ? (
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {failed ? "Standings unavailable." : "Loading…"}
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground" style={MONO}>
                YOUR RANK
              </p>
              <p className="mt-1 text-2xl font-light tabular-nums text-foreground">
                {ordinal(data.rank)}
                <span className="ml-2 text-sm text-muted-foreground">of {data.total}</span>
              </p>
            </div>
            {data.topName && (
              <div className="border-t border-border pt-3">
                <p className="text-[0.6rem] tracking-[0.18em] text-muted-foreground" style={MONO}>
                  TOP APPLICANT
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
                  <Trophy className="size-3.5 text-primary" />
                  <span className="truncate">{data.topName}</span>
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  Score {data.topScore}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
