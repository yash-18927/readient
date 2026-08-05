import type { AnalysisInput } from "./schema";
import { evidenceForField } from "./fields";


export const SYSTEM_PROMPT = `You are a senior campus placement advisor and ATS specialist.
You evaluate student resumes for a specific target role and return a rigorous, honest, evidence-based assessment.
You ALWAYS respond with a single JSON object and nothing else. No markdown fences, no commentary.`;

export const JSON_CONTRACT = `Return JSON with EXACTLY this shape (all keys required):
{
  "overall_score": 0-100,
  "readiness_level": "Beginner" | "Developing" | "Intermediate" | "Advanced" | "Industry Ready",
  "executive_summary": string,
  "credential_audit": string,
  "role_fit_summary": string,
  "encouragement": string,
  "industry_baseline": 0-100,
  "sub_scores": { "ats_compatibility":0-100, "resume_quality":0-100, "skill_match":0-100, "projects":0-100, "interview_readiness":0-100, "github_profile":0-100, "coding_profile":0-100 },
  "pillars": { "academic_alignment":0-20, "core_skill_alignment":0-25, "proof_of_work":0-20, "practical_exposure":0-15, "communication":0-10, "role_specific_readiness":0-10 },
  "ats": {
    "total": 0-100,
    "factors": { "resume_structure":0-20, "keyword_match":0-25, "formatting_safety":0-15, "projects_impact":0-10, "experience_details":0-10, "skills_presence":0-10, "readability_flow":0-5, "parser_accuracy":0-5 },
    "recommendations": string[],
    "keywords": { "matched": string[], "missing": string[] },
    "format": { "sections_present": string[], "sections_missing": string[], "issues": string[] },
    "content": { "strong_verbs": string[], "weak_phrases": string[], "suggestions": string[] }
  },
  "matched_skills": string[],
  "missing_critical_skills": string[],
  "missing_nice_to_have_skills": string[],
  "skill_matrix": { "mandatory": [{ "skill": string, "has": boolean }], "recommended": [{ "skill": string, "has": boolean }] },
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": [{ "skill": string, "reason": string, "resource": string }],
  "roadmap": {
    "weeks_1_2": { "focus": string, "tasks": string[] },
    "month_1": { "focus": string, "tasks": string[] },
    "month_2": { "focus": string, "tasks": string[] },
    "month_3": { "focus": string, "tasks": string[] }
  },
  "interview_questions": { "core": string[], "scenario": string[], "behavioral": string[], "portfolio": string[] },
  "project_suggestions": [{ "name": string, "description": string, "skills": string[], "difficulty": string, "estimated_time": string }]
}

Rules:
- "overall_score" is the sum of the 6 pillar scores (weights: Academic Alignment 20, Core Skill Alignment 25, Proof of Work 20, Practical Exposure 15, Communication 10, Role-Specific Readiness 10).
- "ats.total" is the sum of the 8 ATS factors and must equal "sub_scores.ats_compatibility".
- Level thresholds: <35 Beginner, <55 Developing, <70 Intermediate, <85 Advanced, else Industry Ready.
- Exactly 3 items in "recommendations" and 3 in "project_suggestions".
- 4-6 questions per interview category.
- Coding/GitHub sub-scores apply ONLY to fields where writing code is part of the job. If the field does not use coding evidence (see APPLICABLE EVIDENCE below), score "github_profile" and "coding_profile" from the closest field-appropriate proof instead — publications, portfolio, clinical/lab work, case work, campaigns, design work — and never penalise the candidate for lacking a GitHub or LeetCode profile.
- If evidence that IS applicable to the field was not provided, score those sub-scores low and say so in the credential audit — never invent evidence.
- Be specific to the field and role; avoid generic filler.`;

export function buildAnalysisPrompt(input: AnalysisInput): { system: string; user: string } {
  const evidence = Object.entries(input.evidence)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `- ${key}: ${value.trim()}`)
    .join("\n");

  const applicable = evidenceForField(input.field);

  const user = [
    `FIELD OF STUDY: ${input.field}`,
    `TARGET ROLE: ${input.targetRole}`,
    `APPLICABLE EVIDENCE FOR THIS FIELD: ${applicable.join(", ")}`,
    input.jobDescription?.trim()
      ? `TARGET JOB DESCRIPTION (compare skills and keywords against this specific posting):\n"""\n${input.jobDescription.trim().slice(0, 6000)}\n"""`
      : `No job description supplied — benchmark against typical entry-level expectations for this role.`,
    evidence
      ? `EVIDENCE OF COMPETENCE SUPPLIED BY THE STUDENT (the "linkedin" entry, when present, is a parsed LinkedIn data export):\n${evidence}`
      : `EVIDENCE OF COMPETENCE: none supplied.`,

    `RESUME TEXT:\n"""\n${input.resumeText.slice(0, 20000)}\n"""`,
    JSON_CONTRACT,
  ].join("\n\n");

  return { system: SYSTEM_PROMPT, user };
}
