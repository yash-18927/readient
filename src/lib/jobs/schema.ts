import { z } from "zod";

const list = z.array(z.string()).default([]);

/** AI-structured job posting content (stored in jobs.structured_requirements). */
export const jobRequirementsSchema = z.object({
  summary: z.string().default(""),
  responsibilities: list,
  required_skills: list,
  nice_to_have_skills: list,
  experience_level: z.string().default("Entry level"),
  field: z.string().default(""),
  additional_info: z.string().default(""),
});

/** Role-specific scoring rubric (stored in jobs.rubric). */
export const jobRubricSchema = z.object({
  pillar_weights: z.object({
    academic_alignment: z.coerce.number().min(0).max(100).default(20),
    core_skill_alignment: z.coerce.number().min(0).max(100).default(25),
    proof_of_work: z.coerce.number().min(0).max(100).default(20),
    practical_exposure: z.coerce.number().min(0).max(100).default(15),
    communication: z.coerce.number().min(0).max(100).default(10),
    role_specific_readiness: z.coerce.number().min(0).max(100).default(10),
  }),
  ats_keywords: list,
  evaluation_notes: z.string().default(""),
});

/** Full AI draft returned by the job-structuring model. */
export const jobDraftSchema = z.object({
  title: z.string().default("Untitled role"),
  company: z.string().default(""),
  requirements: jobRequirementsSchema,
  rubric: jobRubricSchema,
});

export type JobRequirements = z.infer<typeof jobRequirementsSchema>;
export type JobRubric = z.infer<typeof jobRubricSchema>;
export type JobDraft = z.infer<typeof jobDraftSchema>;

export const RUBRIC_PILLARS: { key: keyof JobRubric["pillar_weights"]; label: string }[] = [
  { key: "academic_alignment", label: "Academic Alignment" },
  { key: "core_skill_alignment", label: "Core Skill Alignment" },
  { key: "proof_of_work", label: "Proof of Work" },
  { key: "practical_exposure", label: "Practical Exposure" },
  { key: "communication", label: "Communication" },
  { key: "role_specific_readiness", label: "Role-Specific Readiness" },
];

export type JobStatus = "open" | "closed";

export type JobRecord = {
  id: string;
  title: string;
  company: string;
  raw_input: string;
  structured_requirements: JobRequirements;
  rubric: JobRubric;
  share_slug: string;
  status: JobStatus;
  deadline: string | null;
  created_at: string;
};

export function isJobAcceptingSubmissions(job: {
  status: string;
  deadline: string | null;
}): boolean {
  if (job.status !== "open") return false;
  if (job.deadline && new Date(job.deadline).getTime() < Date.now()) return false;
  return true;
}
