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
  // `linkedin` carries a parsed CSV-export summary, so values can be long.
  links: z.record(z.string(), z.string().trim().max(8000)).default({}),

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
    const rubric = jobRubricSchema.parse(job.rubric ?? { pillar_weights: {} });

    const { hashKey } = await import("@/lib/analysis/extract.server");
    const { analysisResultSchema } = await import("@/lib/analysis/schema");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Retrying an identical submission (e.g. after a transient provider error)
    // must not burn another AI call.
    const cacheKey = await hashKey(
      ["job", job.id, data.resumeText, JSON.stringify(data.links)].join("::"),
    );

    let result: AnalysisResult | null = null;

    const cached = await supabaseAdmin
      .from("analysis_cache")
      .select("result")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached.data?.result) {
      const parsed = analysisResultSchema.safeParse(cached.data.result);
      if (parsed.success) result = parsed.data;
    }

    if (!result) {
      try {
        const scored = await scoreCandidate({
          title: job.title,
          company: job.company,
          requirements,
          rubric,
          resumeText: data.resumeText,
          links: data.links,
        });
        result = scored.result;
      } catch (error) {
        if (error instanceof AnalysisError) throw new Error(error.message);
        throw error;
      }
      await supabaseAdmin.from("analysis_cache").upsert({ cache_key: cacheKey, result });
    }


    const score = Math.round(result.overall_score);

    const { error } = await supabase.from("submissions").insert({
      job_id: job.id,
      candidate_name: data.candidateName?.trim() || null,
      candidate_email: data.candidateEmail?.trim() || null,
      links: data.links,
      resume_text: data.resumeText,
      resume_file_name: data.resumeFileName ?? null,
      analysis_result: result,
      score,
    });
    if (error) throw new Error(error.message);

    return { score, result, jobTitle: job.title };
  });
