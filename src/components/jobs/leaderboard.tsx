import { Button } from "@/components/ui/button";
import { scoreTone, TONE_TEXT } from "@/lib/analysis/schema";
import type { SubmissionRecord } from "@/lib/jobs.functions";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

export function Leaderboard({
  submissions,
  loading,
  onOpen,
}: {
  submissions: SubmissionRecord[];
  loading: boolean;
  onOpen: (submission: SubmissionRecord) => void;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading candidates…</p>;

  if (submissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
          NO SUBMISSIONS YET
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Share the job link — candidates can apply without creating an account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission, index) => {
        const result = submission.analysis_result;
        return (
          <div
            key={submission.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border px-5 py-5 transition-colors hover:border-foreground/30"
          >
            <div className="flex min-w-0 gap-4">
              <div
                className="w-8 shrink-0 pt-1 text-xs tabular-nums text-muted-foreground"
                style={MONO}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-medium">
                    {submission.candidate_name || `Candidate ${submission.id.slice(0, 6)}`}
                  </h3>
                  <span
                    className="text-[0.65rem] tracking-[0.22em] text-muted-foreground"
                    style={MONO}
                  >
                    {result.readiness_level.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Applied {new Date(submission.submitted_at).toLocaleString()}
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {result.strengths.slice(0, 2).map((item) => (
                    <li key={item} className="text-foreground/80">
                      + {item.length > 64 ? `${item.slice(0, 64)}…` : item}
                    </li>
                  ))}
                  {result.missing_critical_skills.slice(0, 3).map((item) => (
                    <li key={item}>− {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p
                  className={`text-2xl font-light tabular-nums ${TONE_TEXT[scoreTone(submission.score)]}`}
                >
                  {submission.score}
                </p>
                <p className="text-[0.6rem] tracking-[0.22em] text-muted-foreground" style={MONO}>
                  FIT SCORE
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpen(submission)}>
                View analysis
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
