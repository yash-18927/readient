import { Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/analysis/results/primitives";
import type { JobWithStats } from "@/lib/jobs.functions";

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
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
        <h2 className="text-lg font-semibold">No job postings yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Paste your hiring notes and let the AI structure your first posting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => {
        const expired = Boolean(job.deadline && new Date(job.deadline).getTime() < Date.now());
        const open = job.status === "open" && !expired;
        return (
          <Card key={job.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 py-5">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold">{job.title}</h3>
                  <Chip tone={open ? "green" : "neutral"}>
                    {open ? "Open" : expired ? "Deadline passed" : "Closed"}
                  </Chip>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
