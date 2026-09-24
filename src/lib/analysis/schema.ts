import { z } from "zod";

const score = z.coerce.number().min(0).max(100);
const smallScore = z.coerce.number().min(0);
/** Models sometimes return a comma-joined string (or null) where a list is expected. */
const stringList = z.preprocess((value) => {
  if (value == null) return [];
  if (typeof value === "string") return value.split(",").map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? v : String(v ?? ""))).filter(Boolean);
  return [];
}, z.array(z.string()).default([]));

/** Accepts the common field-name variants models emit for project suggestions. */
const projectSuggestion = z.preprocess((value) => {
  if (typeof value === "string") {
    return {
      name: value,
      description: value,
      skills: [],
      difficulty: "Intermediate",
      estimated_time: "Not specified",
    };
  }
  if (Array.isArray(value)) {
    const text = value
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .filter(Boolean)
      .join(" — ");
    return {
      name: text || "Suggested project",
      description: text || "Build a role-relevant project that demonstrates practical skills.",
      skills: [],
      difficulty: "Intermediate",
      estimated_time: "Not specified",
    };
  }
  if (!value || typeof value !== "object") {
    return {
      name: "Suggested project",
      description: "Build a role-relevant project that demonstrates practical skills.",
      skills: [],
      difficulty: "Intermediate",
      estimated_time: "Not specified",
    };
  }
  const raw = value as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = raw[key];
      if (v != null && v !== "") return typeof v === "string" ? v : String(v);
    }
    return "";
  };
  return {
    name: pick("name", "title", "project", "project_name", "project_title") || "Suggested project",
    description:
      pick("description", "summary", "details", "overview", "what_to_build", "idea") ||
      "Build a role-relevant project that demonstrates practical skills.",
    skills: raw["skills"] ?? raw["skills_practiced"] ?? raw["technologies"] ?? raw["tech_stack"] ?? [],
    difficulty: pick("difficulty", "level", "complexity") || "Intermediate",
    estimated_time:
      pick("estimated_time", "time_estimate", "estimatedTime", "duration", "time", "timeline") ||
      "Not specified",
  };
}, z.object({
  name: z.string(),
  description: z.string(),
  skills: stringList,
  difficulty: z.string(),
  estimated_time: z.string(),
}));


export const readinessLevels = [
  "Beginner",
  "Developing",
  "Intermediate",
  "Advanced",
  "Industry Ready",
] as const;

export const analysisResultSchema = z.object({
  overall_score: score,
  readiness_level: z.enum(readinessLevels),
  executive_summary: z.string(),
  credential_audit: z.string(),
  role_fit_summary: z.string(),
  encouragement: z.string(),
  industry_baseline: score.default(70),
  sub_scores: z.object({
    ats_compatibility: score,
    resume_quality: score,
    skill_match: score,
    projects: score,
    interview_readiness: score,
    github_profile: score,
    coding_profile: score,
  }),
  pillars: z.object({
    academic_alignment: smallScore.max(20),
    core_skill_alignment: smallScore.max(25),
    proof_of_work: smallScore.max(20),
    practical_exposure: smallScore.max(15),
    communication: smallScore.max(10),
    role_specific_readiness: smallScore.max(10),
  }),
  ats: z.object({
    total: score,
    factors: z.object({
      resume_structure: smallScore.max(20),
      keyword_match: smallScore.max(25),
      formatting_safety: smallScore.max(15),
      projects_impact: smallScore.max(10),
      experience_details: smallScore.max(10),
      skills_presence: smallScore.max(10),
      readability_flow: smallScore.max(5),
      parser_accuracy: smallScore.max(5),
    }),
    recommendations: stringList,
    keywords: z.object({ matched: stringList, missing: stringList }),
    format: z.object({
      sections_present: stringList,
      sections_missing: stringList,
      issues: stringList,
    }),
    content: z.object({
      strong_verbs: stringList,
      weak_phrases: stringList,
      suggestions: stringList,
    }),
  }),
  matched_skills: stringList,
  missing_critical_skills: stringList,
  missing_nice_to_have_skills: stringList,
  skill_matrix: z.object({
    mandatory: z.array(z.object({ skill: z.string(), has: z.boolean() })).default([]),
    recommended: z.array(z.object({ skill: z.string(), has: z.boolean() })).default([]),
  }),
  strengths: stringList,
  weaknesses: stringList,
  recommendations: z
    .array(
      z.object({
        skill: z.string(),
        reason: z.string(),
        // Models sometimes return resource as an object, array, or null — flatten to text.
        resource: z.preprocess((v) => {
          if (v == null) return "";
          if (typeof v === "string") return v;
          if (Array.isArray(v))
            return v
              .map((x) => (typeof x === "string" ? x : Object.values(x ?? {}).filter(Boolean).join(" — ")))
              .join("; ");
          if (typeof v === "object") return Object.values(v).filter(Boolean).join(" — ");
          return String(v);
        }, z.string()),
      }),
    )
    .default([]),
  roadmap: z.object({
    weeks_1_2: z.object({ focus: z.string(), tasks: stringList }),
    month_1: z.object({ focus: z.string(), tasks: stringList }),
    month_2: z.object({ focus: z.string(), tasks: stringList }),
    month_3: z.object({ focus: z.string(), tasks: stringList }),
  }),
  interview_questions: z.object({
    core: stringList,
    scenario: stringList,
    behavioral: stringList,
    portfolio: stringList,
  }),
  project_suggestions: z.array(projectSuggestion).default([]),

});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const PILLAR_META: { key: keyof AnalysisResult["pillars"]; label: string; max: number }[] = [
  { key: "academic_alignment", label: "Academic Alignment", max: 20 },
  { key: "core_skill_alignment", label: "Core Skill Alignment", max: 25 },
  { key: "proof_of_work", label: "Proof of Work", max: 20 },
  { key: "practical_exposure", label: "Practical Exposure", max: 15 },
  { key: "communication", label: "Communication", max: 10 },
  { key: "role_specific_readiness", label: "Role-Specific Readiness", max: 10 },
];

export const ATS_FACTOR_META: { key: keyof AnalysisResult["ats"]["factors"]; label: string; max: number }[] = [
  { key: "resume_structure", label: "Resume Structure", max: 20 },
  { key: "keyword_match", label: "Keyword Match", max: 25 },
  { key: "formatting_safety", label: "Formatting Safety", max: 15 },
  { key: "projects_impact", label: "Projects Impact", max: 10 },
  { key: "experience_details", label: "Experience Details", max: 10 },
  { key: "skills_presence", label: "Skills Presence", max: 10 },
  { key: "readability_flow", label: "Readability & Flow", max: 5 },
  { key: "parser_accuracy", label: "Parser Accuracy", max: 5 },
];

export const SUB_SCORE_META: { key: keyof AnalysisResult["sub_scores"]; label: string }[] = [
  { key: "ats_compatibility", label: "ATS Compatibility" },
  { key: "resume_quality", label: "Resume Quality" },
  { key: "skill_match", label: "Skill Match" },
  { key: "projects", label: "Projects" },
  { key: "interview_readiness", label: "Interview Readiness" },
  { key: "github_profile", label: "GitHub Profile" },
  { key: "coding_profile", label: "Coding Profile" },
];

export function scoreTone(pct: number): "low" | "mid" | "high" {
  if (pct < 50) return "low";
  if (pct < 75) return "mid";
  return "high";
}

export const TONE_BAR: Record<"low" | "mid" | "high", string> = {
  low: "bg-destructive",
  mid: "bg-warning",
  high: "bg-success",
};

export const TONE_TEXT: Record<"low" | "mid" | "high", string> = {
  low: "text-destructive",
  mid: "text-warning",
  high: "text-success",
};

export type AnalysisInput = {
  field: string;
  targetRole: string;
  jobDescription?: string;
  evidence: Record<string, string>;
  resumeText: string;
  resumeFileName?: string;
};
