import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { JobWithStats } from "@/lib/jobs.functions";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

function shareUrl(slug: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/apply/${slug}`;
}

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(shareUrl(slug));
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

export function JobList({
  jobs,
  loading,
  onToggleStatus,
  onDelete,
}: {
  jobs: JobWithStats[];
  loading: boolean;
  onToggleStatus: (job: JobWithStats) => void;
  onDelete: (job: JobWithStats) => void;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading your job postings…</p>;

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
          NO POSTINGS YET
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Paste your hiring notes and let the AI structure your first posting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const expired = Boolean(job.deadline && new Date(job.deadline).getTime() < Date.now());
        const open = job.status === "open" && !expired;
        return (
          <div
            key={job.id}
            className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border px-5 py-5 transition-colors hover:border-foreground/30"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-medium">{job.title}</h3>
                <span
                  className={
                    open
                      ? "text-[0.65rem] tracking-[0.22em] text-primary"
                      : "text-[0.65rem] tracking-[0.22em] text-muted-foreground"
                  }
                  style={MONO}
                >
                  {open ? "OPEN" : expired ? "DEADLINE PASSED" : "CLOSED"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {job.company || "No company"} · {job.applicants} applicant
                {job.applicants === 1 ? "" : "s"} · avg score {job.average_score} · created{" "}
                {new Date(job.created_at).toLocaleDateString()}
                {job.deadline ? ` · closes ${new Date(job.deadline).toLocaleDateString()}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyLink slug={job.share_slug} />
              <Button variant="outline" size="sm" onClick={() => onToggleStatus(job)}>
                {job.status === "open" ? "Close job" : "Reopen"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete job"
                onClick={() => onDelete(job)}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button asChild size="sm">
                <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                  <ExternalLink className="mr-2 size-4" /> Candidates
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
