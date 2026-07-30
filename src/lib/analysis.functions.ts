import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AnalysisResult } from "@/lib/analysis/schema";

const extractInput = z.object({
  fileName: z.string().min(1),
  base64: z.string().min(1),
});

export const extractResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => extractInput.parse(data))
  .handler(async ({ data }) => {
    const { extractResumeText, ExtractionError } = await import("@/lib/analysis/extract.server");
    try {
      const text = await extractResumeText(data.fileName, data.base64);
      return { text };
    } catch (error) {
      if (error instanceof ExtractionError) throw new Error(error.message);
      console.error("[extract]", error);
      throw new Error("We could not read this file. Please try a different PDF or DOCX.");
    }
  });

const analyzeInput = z.object({
  field: z.string().min(1),
  targetRole: z.string().min(1),
  jobDescription: z.string().optional(),
  evidence: z.record(z.string(), z.string()).default({}),
  resumeText: z.string().min(100),
  resumeFileName: z.string().optional(),
});

export type AnalysisRecord = {
  id: string;
  created_at: string;
  field: string;
  target_role: string;
  overall_score: number;
  resume_file_name: string | null;
  job_description: string | null;
  evidence: Record<string, string>;
  resume_text: string;
  result: AnalysisResult;
};

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => analyzeInput.parse(data))
  .handler(async ({ data, context }): Promise<AnalysisRecord> => {
    const { hashKey } = await import("@/lib/analysis/extract.server");
    const { runAnalysisModel, AnalysisError } = await import("@/lib/analysis/ai.server");
    const { analysisResultSchema } = await import("@/lib/analysis/schema");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const resumeHash = await hashKey(data.resumeText);
    const cacheKey = await hashKey(
      [data.resumeText, data.field, data.targetRole, data.jobDescription ?? "", JSON.stringify(data.evidence)].join("::"),
    );

    let result: AnalysisResult | null = null;
    let model = "cache";

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
        const fresh = await runAnalysisModel({
          field: data.field,
          targetRole: data.targetRole,
          jobDescription: data.jobDescription,
          evidence: data.evidence,
          resumeText: data.resumeText,
        });
        result = fresh.result;
        model = fresh.model;
      } catch (error) {
        if (error instanceof AnalysisError) throw new Error(error.message);
        throw error;
      }
      await supabaseAdmin.from("analysis_cache").upsert({ cache_key: cacheKey, result });
    }

    const { data: inserted, error } = await context.supabase
      .from("analyses")
      .insert({
        user_id: context.userId,
        resume_hash: resumeHash,
        field: data.field,
        target_role: data.targetRole,
        job_description: data.jobDescription ?? null,
        evidence: data.evidence,
        resume_text: data.resumeText,
        resume_file_name: data.resumeFileName ?? null,
        result,
        overall_score: Math.round(result.overall_score),
      })
      .select("id, created_at, field, target_role, overall_score, resume_file_name, job_description, evidence, resume_text, result")
      .single();

    if (error) throw new Error(error.message);

    await supabaseAdmin.from("analysis_logs").insert({
      user_id: context.userId,
      session_id: inserted.id,
      field: data.field,
      target_role: data.targetRole,
      overall_score: Math.round(result.overall_score),
      model,
    });

    return inserted as unknown as AnalysisRecord;
  });

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalysisRecord[]> => {
    const { data, error } = await context.supabase
      .from("analyses")
      .select("id, created_at, field, target_role, overall_score, resume_file_name, job_description, evidence, resume_text, result")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AnalysisRecord[];
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("analyses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
