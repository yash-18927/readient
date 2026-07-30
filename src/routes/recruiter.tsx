import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { JobCreator, type JobFormValues } from "@/components/jobs/job-creator";
import { JobList } from "@/components/jobs/job-list";
import { JobAnalytics } from "@/components/jobs/job-analytics";
import { setPendingRole, useProfile, useSession } from "@/lib/auth";
import {
  createJob,
  deleteJob,
  draftJob,
  listJobs,
  updateJob,
  type JobWithStats,
} from "@/lib/jobs.functions";

export const Route = createFileRoute("/recruiter")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Recruiter workspace — PlacementIQ" },
      { name: "description", content: "Post roles and rank candidates with AI." },
      { property: "og:title", content: "Recruiter workspace — PlacementIQ" },
      { property: "og:description", content: "Post roles and rank candidates with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const signedIn = Boolean(session);

  const draftFn = useServerFn(draftJob);
  const createFn = useServerFn(createJob);
  const updateFn = useServerFn(updateJob);
  const deleteFn = useServerFn(deleteJob);
  const listFn = useServerFn(listJobs);

  const [creating, setCreating] = useState(false);

  // Students land on their own workspace.
  useEffect(() => {
    if (profile && profile.role === "student") navigate({ to: "/student", replace: true });
  }, [profile, navigate]);

  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: () => listFn({}),
    enabled: signedIn,
  });

  function goToAuth(mode: "signin" | "signup") {
    setPendingRole("recruiter");
    navigate({ to: "/auth", search: { role: "recruiter", mode } });
  }

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["jobs"] });

  const drafting = useMutation({
    mutationFn: (rawInput: string) => draftFn({ data: { rawInput } }),
    onError: (error) =>
      toast.error("Could not structure the role", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const publishing = useMutation({
    mutationFn: (values: {
      title: string;
      company: string;
      rawInput: string;
      requirements: JobFormValues["requirements"];
      rubric: JobFormValues["rubric"];
      deadline: string | null;
    }) => createFn({ data: values }),

    onSuccess: () => {
      setCreating(false);
      invalidate();
      toast.success("Job published", { description: "Share the link to start collecting candidates." });
    },
    onError: (error) =>
      toast.error("Could not publish the job", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const statusChange = useMutation({
    mutationFn: (job: JobWithStats) =>
      updateFn({ data: { id: job.id, status: job.status === "open" ? "closed" : "open" } }),
    onSuccess: invalidate,
  });

  const removal = useMutation({
    mutationFn: (job: JobWithStats) => deleteFn({ data: { id: job.id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Job deleted");
    },
  });

  const allScores = (jobs.data ?? []).flatMap((job) =>
    job.applicants > 0 ? Array.from({ length: job.applicants }, () => job.average_score) : [],
  );

  return (
    <DashboardLayout
      profile={profile ?? null}
      signedIn={signedIn}
      role="recruiter"
      title={
        signedIn && profile?.full_name
          ? `Hi, ${profile.full_name.split(" ")[0]}`
          : "Recruiter workspace"
      }
      subtitle="Turn hiring notes into a structured posting and rank every applicant automatically."
      navItems={[{ label: "Overview", active: true }, { label: "Job postings" }, { label: "Candidates" }]}
    >
      {!loading && !signedIn ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <h2 className="text-lg font-semibold">Sign in to post a role</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your job postings, share links, and candidate rankings are saved to your recruiter account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => goToAuth("signup")}>Create account</Button>
            <Button variant="outline" onClick={() => goToAuth("signin")}>
              Sign in
            </Button>
          </div>
        </div>
      ) : creating ? (
        <JobCreator
          drafting={drafting.isPending}
          onDraft={(rawInput) => drafting.mutateAsync(rawInput)}
          publishing={publishing.isPending}
          onPublish={(values) =>
            publishing.mutate({
              title: values.title,
              company: values.company,
              rawInput: values.rawInput,
              requirements: values.requirements,
              rubric: values.rubric,
              deadline: values.deadline,
            })
          }
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Your job postings</h2>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 size-4" /> New job
            </Button>
          </div>
          {(jobs.data ?? []).length > 0 && <JobAnalytics scores={allScores} />}
          <JobList
            jobs={jobs.data ?? []}
            loading={jobs.isLoading}
            onToggleStatus={(job) => statusChange.mutate(job)}
            onDelete={(job) => removal.mutate(job)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
