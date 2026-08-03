import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard-layout";

import { JobAnalytics } from "@/components/jobs/job-analytics";
import { Leaderboard } from "@/components/jobs/leaderboard";
import { CandidateReport } from "@/components/jobs/candidate-report";
import { useProfile, useSession } from "@/lib/auth";
import { getJobDetail, type SubmissionRecord } from "@/lib/jobs.functions";
import { isJobAcceptingSubmissions } from "@/lib/jobs/schema";

export const Route = createFileRoute("/jobs/$jobId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job candidates — Readient" },
      { name: "description", content: "Ranked applicants for your job posting." },
      { property: "og:title", content: "Job candidates — Readient" },
      { property: "og:description", content: "Ranked applicants for your job posting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const detailFn = useServerFn(getJobDetail);

  const [open, setOpen] = useState<SubmissionRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const detail = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => detailFn({ data: { id: jobId } }),
    enabled: Boolean(session),
  });

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", search: { role: "recruiter", mode: "signin" }, replace: true });
    }
  }, [loading, session, navigate]);

  const job = detail.data?.job;
  const submissions = detail.data?.submissions ?? [];
  const accepting = job ? isJobAcceptingSubmissions(job) : false;

  return (
    <DashboardLayout
      profile={profile ?? null}
      signedIn={Boolean(session)}
      role="recruiter"
      title={job?.title ?? "Job posting"}
      subtitle={job ? `${job.company || "No company"} · ${submissions.length} applicant${submissions.length === 1 ? "" : "s"}` : "Loading…"}
      navItems={[{ label: "Overview" }, { label: "Job postings" }, { label: "Candidates", active: true }]}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link to="/recruiter">
              <ArrowLeft className="mr-2 size-4" /> Back to jobs
            </Link>
          </Button>
          {job && (
            <div className="flex items-center gap-4">
              <span
                className={
                  accepting
                    ? "text-[0.65rem] tracking-[0.22em] text-primary"
                    : "text-[0.65rem] tracking-[0.22em] text-muted-foreground"
                }
                style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
              >
                {accepting ? "OPEN" : "CLOSED"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/apply/${job.share_slug}`,
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                {copied ? "Copied" : "Copy apply link"}
              </Button>
            </div>
          )}
        </div>

        {detail.isError && (
          <p className="text-sm text-muted-foreground">
            We could not load this job posting. It may have been deleted.
          </p>
        )}

        {open ? (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium">
                  {open.candidate_name || `Candidate ${open.id.slice(0, 6)}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {open.candidate_email || "No email supplied"} · fit score {open.score}
                </p>
              </div>
              <Button variant="outline" onClick={() => setOpen(null)}>
                Back to ranking
              </Button>
            </div>
            <CandidateReport result={open.analysis_result} />
          </div>
        ) : (
          <>
            {submissions.length > 0 && (
              <JobAnalytics scores={submissions.map((submission) => submission.score)} />
            )}
            <Leaderboard
              submissions={submissions}
              loading={detail.isLoading}
              onOpen={setOpen}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
