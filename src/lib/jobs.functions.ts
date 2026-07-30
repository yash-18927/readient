import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalysisResult } from "@/lib/analysis/schema";
import {
  jobRequirementsSchema,
  jobRubricSchema,
  type JobRecord,
  type JobRequirements,
  type JobRubric,
  type JobStatus,
} from "@/lib/jobs/schema";

const JOB_COLUMNS =
  "id, title, company, raw_input, structured_requirements, rubric, share_slug, status, deadline, created_at";

export type JobWithStats = JobRecord & {
  applicants: number;
  average_score: number;
};

export type SubmissionRecord = {
  id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  links: Record<string, string>;
  score: number;
  submitted_at: string;
  resume_file_name: string | null;
  resume_text: string;
  analysis_result: AnalysisResult;
};

/** Turns raw recruiter notes into a structured, editable job draft. */
export const draftJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ rawInput: z.string().min(30).max(20000) }).parse(data))
  .handler(async ({ data }) => {
    const { structureJobPosting } = await import("@/lib/jobs/ai.server");
    const { AnalysisError } = await import("@/lib/analysis/ai.server");
    try {
      const { result } = await structureJobPosting(data.rawInput);
      return result;
    } catch (error) {
      if (error instanceof AnalysisError) throw new Error(error.message);
      throw error;
    }
  });

const jobPayload = z.object({
  title: z.string().min(2).max(200),
  company: z.string().max(200).default(""),
  rawInput: z.string().max(20000).default(""),
  requirements: jobRequirementsSchema,
  rubric: jobRubricSchema,
  deadline: z.string().nullable().default(null),
});

function randomSlug(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => jobPayload.parse(data))
  .handler(async ({ data, context }): Promise<JobRecord> => {
    const { data: inserted, error } = await context.supabase
      .from("jobs")
      .insert({
        recruiter_id: context.userId,
        title: data.title,
        company: data.company,
        raw_input: data.rawInput,
        structured_requirements: data.requirements,
        rubric: data.rubric,
        share_slug: randomSlug(),
        status: "open",
        deadline: data.deadline,
      })
      .select(JOB_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return inserted as unknown as JobRecord;
  });

export const updateJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    jobPayload
      .partial()
      .extend({
        id: z.string().uuid(),
        status: z.enum(["open", "closed"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<JobRecord> => {
    const patch: {
      title?: string;
      company?: string;
      structured_requirements?: JobRequirements;
      rubric?: JobRubric;
      deadline?: string | null;
      status?: JobStatus;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.company !== undefined) patch.company = data.company;
    if (data.requirements !== undefined) patch.structured_requirements = data.requirements;
    if (data.rubric !== undefined) patch.rubric = data.rubric;
    if (data.deadline !== undefined) patch.deadline = data.deadline;
    if (data.status !== undefined) patch.status = data.status;

    const { data: updated, error } = await context.supabase
      .from("jobs")
      .update(patch)
      .eq("id", data.id)
      .select(JOB_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return updated as unknown as JobRecord;
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Recruiter's own jobs with per-job applicant counts and average score. */
export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<JobWithStats[]> => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select(JOB_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const jobs = (data ?? []) as unknown as JobRecord[];
    if (jobs.length === 0) return [];

    const { data: subs, error: subError } = await context.supabase
      .from("submissions")
      .select("job_id, score")
      .in(
        "job_id",
        jobs.map((job) => job.id),
      );
    if (subError) throw new Error(subError.message);

    return jobs.map((job) => {
      const scores = (subs ?? []).filter((s) => s.job_id === job.id).map((s) => s.score);
      return {
        ...job,
        applicants: scores.length,
        average_score: scores.length
          ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
          : 0,
      };
    });
  });

/** Full job detail plus its ranked submissions (recruiter-only). */
export const getJobDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ job: JobRecord; submissions: SubmissionRecord[] }> => {
    const { data: job, error } = await context.supabase
      .from("jobs")
      .select(JOB_COLUMNS)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: subs, error: subError } = await context.supabase
      .from("submissions")
      .select(
        "id, candidate_name, candidate_email, links, score, submitted_at, resume_file_name, resume_text, analysis_result",
      )
      .eq("job_id", data.id)
      .order("score", { ascending: false })
      .limit(200);
    if (subError) throw new Error(subError.message);

    return {
      job: job as unknown as JobRecord,
      submissions: (subs ?? []) as unknown as SubmissionRecord[],
    };
  });

export type { JobRecord, JobRequirements, JobRubric, JobStatus };
