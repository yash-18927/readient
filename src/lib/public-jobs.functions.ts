import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AnalysisResult } from "@/lib/analysis/schema";
import {
  jobRequirementsSchema,
  jobRubricSchema,
  isJobAcceptingSubmissions,
  type JobRequirements,
} from "@/lib/jobs/schema";


export type PublicJob = {
  title: string;
  company: string;
  requirements: JobRequirements;
  status: string;
  deadline: string | null;
  accepting: boolean;
};

/** Public, read-only view of a job posting resolved by its unguessable slug. */
export const getPublicJob = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(8).max(64) }).parse(data))
  .handler(async ({ data }): Promise<{ job: PublicJob | null }> => {
    const { createPublicClient } = await import("@/lib/jobs/public-client.server");
    const supabase = createPublicClient();
    const { data: rows } = await supabase.rpc("public_job_by_slug", { _slug: data.slug });
    const job = rows?.[0];
    if (!job) return { job: null };

    return {
      job: {
      title: job.title,
      company: job.company,
      requirements: jobRequirementsSchema.parse(job.structured_requirements ?? {}),
      status: job.status,
      deadline: job.deadline,
      accepting: isJobAcceptingSubmissions({ status: job.status, deadline: job.deadline }),
      },
    };
  });

/** Public resume text extraction for candidates (no account required). */
export const extractPublicResume = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ fileName: z.string().min(1), base64: z.string().min(1).max(9_000_000) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { extractResumeText, ExtractionError } = await import("@/lib/analysis/extract.server");
    try {
      return { text: await extractResumeText(data.fileName, data.base64) };
    } catch (error) {
      if (error instanceof ExtractionError) throw new Error(error.message);
      console.error("[public-extract]", error);
      throw new Error("We could not read this file. Please try a different PDF or DOCX.");
    }
  });

const submissionInput = z.object({
  slug: z.string().min(8).max(64),
  candidateName: z.string().trim().max(120).optional(),
  candidateEmail: z.string().trim().email().max(255).optional().or(z.literal("")),
  links: z.record(z.string(), z.string().trim().max(500)).default({}),
  linkedinSummary: z.string().trim().max(12000).optional(),
  resumeText: z.string().min(100).max(60000),
  resumeFileName: z.string().max(255).optional(),
});

/**
 * Scores a candidate against one open job and stores the submission.
 * Fully unauthenticated: the only write path is this function, which requires a
 * valid slug and an open, in-deadline job.
 */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submissionInput.parse(data))
  .handler(async ({ data }): Promise<{ score: number; result: AnalysisResult; jobTitle: string }> => {
    const { createPublicClient } = await import("@/lib/jobs/public-client.server");
    const supabase = createPublicClient();
    const { scoreCandidate } = await import("@/lib/jobs/ai.server");
    const { AnalysisError } = await import("@/lib/analysis/ai.server");

    const { data: rows } = await supabase.rpc("public_job_by_slug", { _slug: data.slug });
    const job = rows?.[0];

    if (!job) throw new Error("This job posting could not be found.");
    if (!isJobAcceptingSubmissions({ status: job.status, deadline: job.deadline })) {
      throw new Error("This job is no longer accepting submissions.");
    }

    const requirements = jobRequirementsSchema.parse(job.structured_requirements ?? {});

    // The rubric is deliberately absent from `public_job_by_slug` so an anon
    // caller with a share_slug can never read it. Scoring still needs it, so
    // read it here through the service-role client after the slug has already
    // resolved to an open job. The rubric is used only to build the prompt and
    // is never returned to the candidate.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rubricRow } = await supabaseAdmin
      .from("jobs")
      .select("rubric")
      .eq("id", job.id)
      .maybeSingle();
    const rubric = jobRubricSchema.parse(rubricRow?.rubric ?? { pillar_weights: {} });

    const links = {
      ...data.links,
      ...(data.linkedinSummary ? { linkedin_export: data.linkedinSummary } : {}),
    };

    let result: AnalysisResult;
    try {
      const scored = await scoreCandidate({
        title: job.title,
        company: job.company,
        requirements,
        rubric,
        resumeText: data.resumeText,
        links,
      });
      result = scored.result;
    } catch (error) {
      if (error instanceof AnalysisError) throw new Error(error.message);
      throw error;
    }

    const score = Math.round(result.overall_score);

    const { error } = await supabase.from("submissions").insert({
      job_id: job.id,
      candidate_name: data.candidateName?.trim() || null,
      candidate_email: data.candidateEmail?.trim() || null,
      links,
      resume_text: data.resumeText,
      resume_file_name: data.resumeFileName ?? null,
      analysis_result: result,
      score,
    });
    if (error) throw new Error(error.message);

    return { score, result, jobTitle: job.title };
  });

export type ApplicantRank = {
  rank: number;
  total: number;
  topName: string | null;
  topScore: number | null;
};

/** Rank of one submitted score among all applicants for a shared job link. */
export const getApplicantRank = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(8).max(64), score: z.number().int().min(0).max(100) }).parse(data),
  )
  .handler(async ({ data }): Promise<ApplicantRank> => {
    const { createPublicClient } = await import("@/lib/jobs/public-client.server");
    const supabase = createPublicClient();
    const { data: rows, error } = await supabase.rpc("public_job_rank", {
      _slug: data.slug,
      _score: data.score,
    });
    if (error) throw new Error(error.message);
    const row = rows?.[0];
    if (!row) throw new Error("Standings are not available for this job.");
    return {
      rank: row.rank ?? 1,
      total: row.total ?? 1,
      topName: row.top_name ?? null,
      topScore: row.top_score ?? null,
    };
  });

export type StandingRow = { rank: number; name: string; score: number };

/** Full ordered applicant list (name + score only) for a shared job link. */
export const getJobStandings = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(8).max(64) }).parse(data))
  .handler(async ({ data }): Promise<{ rows: StandingRow[] }> => {
    const { createPublicClient } = await import("@/lib/jobs/public-client.server");
    const supabase = createPublicClient();
    const { data: rows, error } = await supabase.rpc("public_job_standings", { _slug: data.slug });
    if (error) throw new Error(error.message);
    return {
      rows: (rows ?? []).map((r: { rank: number; name: string; score: number }) => ({
        rank: r.rank,
        name: r.name,
        score: r.score,
      })),
    };
  });
