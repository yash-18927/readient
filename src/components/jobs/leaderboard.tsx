import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/analysis/results/primitives";
import { scoreTone, TONE_TEXT } from "@/lib/analysis/schema";
import type { SubmissionRecord } from "@/lib/jobs.functions";

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
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
        <h2 className="text-lg font-semibold">No submissions yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
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
          <Card key={submission.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div className="flex min-w-0 gap-4">
                <div className="w-8 shrink-0 pt-1 text-sm font-semibold text-muted-foreground tabular-nums">
                  #{index + 1}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold">
                      {submission.candidate_name || `Candidate ${submission.id.slice(0, 6)}`}
                    </h3>
                    <Chip tone="neutral">{result.readiness_level}</Chip>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(submission.submitted_at).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.strengths.slice(0, 2).map((item) => (
                      <Chip key={item} tone="green">
                        {item.length > 48 ? `${item.slice(0, 48)}…` : item}
                      </Chip>
                    ))}
                    {result.missing_critical_skills.slice(0, 3).map((item) => (
                      <Chip key={item} tone="red">
                        {item}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold tabular-nums ${TONE_TEXT[scoreTone(submission.score)]}`}
                  >
                    {submission.score}
                  </p>
                  <p className="text-xs text-muted-foreground">fit score</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => onOpen(submission)}>
                  View analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
