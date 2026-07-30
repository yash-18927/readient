import { runJsonModel } from "@/lib/analysis/ai.server";
import { analysisResultSchema, type AnalysisResult } from "@/lib/analysis/schema";
import { buildCandidatePrompt, buildJobStructurePrompt } from "./prompt.server";
import { jobDraftSchema, type JobDraft, type JobRequirements, type JobRubric } from "./schema";

export async function structureJobPosting(rawInput: string): Promise<{ result: JobDraft; model: string }> {
  const { system, user } = buildJobStructurePrompt(rawInput);
  return runJsonModel(system, user, jobDraftSchema, "job-structure");
}

export async function scoreCandidate(input: {
  title: string;
  company: string;
  requirements: JobRequirements;
  rubric: JobRubric;
  resumeText: string;
  links: Record<string, string>;
}): Promise<{ result: AnalysisResult; model: string }> {
  const { system, user } = buildCandidatePrompt(input);
  return runJsonModel(system, user, analysisResultSchema, "candidate-scoring");
}
