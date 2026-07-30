import { JSON_CONTRACT } from "@/lib/analysis/prompt.server";
import type { JobRequirements, JobRubric } from "./schema";

export const JOB_STRUCTURE_SYSTEM = `You are a technical recruiter who turns messy hiring notes into clean, structured job postings.
You ALWAYS respond with a single JSON object and nothing else. No markdown fences, no commentary.`;

const JOB_JSON_CONTRACT = `Return JSON with EXACTLY this shape (all keys required):
{
  "title": string,
  "company": string,
  "requirements": {
    "summary": string,
    "responsibilities": string[],
    "required_skills": string[],
    "nice_to_have_skills": string[],
    "experience_level": string
  },
  "rubric": {
    "pillar_weights": {
      "academic_alignment": number,
      "core_skill_alignment": number,
      "proof_of_work": number,
      "practical_exposure": number,
      "communication": number,
      "role_specific_readiness": number
    },
    "ats_keywords": string[],
    "evaluation_notes": string
  }
}

Rules:
- The six pillar weights are percentages and MUST sum to 100. Tilt them toward what this specific role actually needs (e.g. a research role weights academic alignment higher; a dev role weights proof of work higher).
- "ats_keywords" are 10-20 concrete terms an ATS would scan for in a resume for this role.
- "evaluation_notes" is 2-3 sentences telling a resume evaluator what separates a strong from a weak candidate for THIS role.
- 4-8 responsibilities, 5-12 required skills, 3-8 nice-to-have skills.
- If company name is not stated, return an empty string — never invent one.`;

export function buildJobStructurePrompt(rawInput: string): { system: string; user: string } {
  return {
    system: JOB_STRUCTURE_SYSTEM,
    user: [
      `RAW RECRUITER INPUT:\n"""\n${rawInput.trim().slice(0, 12000)}\n"""`,
      JOB_JSON_CONTRACT,
    ].join("\n\n"),
  };
}

export const CANDIDATE_SYSTEM = `You are a senior technical recruiter and ATS specialist.
You evaluate a candidate's resume strictly against one specific job posting and return a rigorous, honest, evidence-based assessment.
You ALWAYS respond with a single JSON object and nothing else. No markdown fences, no commentary.`;

export function buildCandidatePrompt(input: {
  title: string;
  company: string;
  requirements: JobRequirements;
  rubric: JobRubric;
  resumeText: string;
  links: Record<string, string>;
}): { system: string; user: string } {
  const weights = Object.entries(input.rubric.pillar_weights)
    .map(([key, value]) => `- ${key}: ${value}% emphasis`)
    .join("\n");

  const links = Object.entries(input.links)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `- ${key}: ${value.trim()}`)
    .join("\n");

  const user = [
    `TARGET JOB: ${input.title}${input.company ? ` at ${input.company}` : ""}`,
    `EXPERIENCE LEVEL EXPECTED: ${input.requirements.experience_level}`,
    `ROLE SUMMARY: ${input.requirements.summary}`,
    `RESPONSIBILITIES:\n${input.requirements.responsibilities.map((r) => `- ${r}`).join("\n")}`,
    `REQUIRED SKILLS: ${input.requirements.required_skills.join(", ")}`,
    `NICE-TO-HAVE SKILLS: ${input.requirements.nice_to_have_skills.join(", ")}`,
    `ATS KEYWORDS FOR THIS JOB: ${input.rubric.ats_keywords.join(", ")}`,
    `RECRUITER RUBRIC EMPHASIS (relative importance for this job):\n${weights}`,
    input.rubric.evaluation_notes ? `EVALUATOR NOTES: ${input.rubric.evaluation_notes}` : "",
    links ? `CANDIDATE LINKS:\n${links}` : `CANDIDATE LINKS: none supplied.`,
    `RESUME TEXT:\n"""\n${input.resumeText.slice(0, 20000)}\n"""`,
    `Score the candidate ONLY against this job. Use the job's required/nice-to-have skills as the skill matrix, and the job's ATS keywords for keyword matching. The pillar point maxima below are fixed, but apply the recruiter rubric emphasis when deciding how harshly to judge each pillar. "field" context is this job's domain; "target role" is the job title above.`,
    JSON_CONTRACT,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { system: CANDIDATE_SYSTEM, user };
}
