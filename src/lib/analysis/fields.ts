export type EvidenceKey =
  | "github"
  | "linkedin"
  | "portfolio"
  | "leetcode"
  | "other_verified"
  | "certifications"
  | "internships"
  | "projects"
  | "publications";

export const EVIDENCE_LABELS: Record<EvidenceKey, { label: string; placeholder: string; multiline?: boolean }> = {
  github: { label: "GitHub username", placeholder: "octocat" },
  linkedin: { label: "LinkedIn data export (optional)", placeholder: "Upload your LinkedIn export (.zip)", multiline: true },
  portfolio: { label: "Portfolio URL", placeholder: "https://yourname.dev" },
  leetcode: { label: "LeetCode username", placeholder: "yourhandle" },
  other_verified: {
    label: "Other verified work (optional)",
    placeholder: "e.g. Solved 200+ problems on HackerRank, completed 3 Kaggle competitions.",
    multiline: true,
  },
  certifications: { label: "Certifications", placeholder: "AWS Cloud Practitioner, NPTEL…", multiline: true },
  internships: { label: "Internship details", placeholder: "Role, company, duration, what you did", multiline: true },
  projects: { label: "Project descriptions", placeholder: "What you built, stack, outcome", multiline: true },
  publications: { label: "Publications", placeholder: "Title, journal / conference, year", multiline: true },
};

const CORE: EvidenceKey[] = ["linkedin", "portfolio", "certifications", "internships", "projects", "other_verified"];
const TECH: EvidenceKey[] = ["github", "leetcode", ...CORE];
const RESEARCH: EvidenceKey[] = [...CORE, "publications"];

export type FieldDef = {
  name: string;
  roles: string[];
  evidence: EvidenceKey[];
};

export const FIELDS: FieldDef[] = [
  {
    name: "Engineering",
    roles: [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Data Engineer",
      "Machine Learning Engineer",
      "DevOps Engineer",
      "Embedded Systems Engineer",
      "QA Engineer",
      "Civil Site Engineer",
      "Mechanical Design Engineer",
    ],
    evidence: TECH,
  },
  {
    name: "Pharmacy",
    roles: ["Pharmacovigilance Associate", "Clinical Research Associate", "Regulatory Affairs Executive", "Formulation Scientist", "Quality Control Analyst", "Medical Writer"],
    evidence: RESEARCH,
  },
  {
    name: "Law",
    roles: ["Corporate Legal Associate", "Litigation Associate", "Legal Researcher", "Compliance Analyst", "Contract Manager", "Intellectual Property Associate"],
    evidence: RESEARCH,
  },
  {
    name: "Management",
    roles: ["Business Analyst", "Product Manager", "Marketing Associate", "Operations Executive", "Human Resources Executive", "Financial Analyst", "Management Consultant"],
    evidence: [...CORE, "github"],
  },
  {
    name: "Arts",
    roles: ["Content Writer", "Copywriter", "Research Assistant", "Public Policy Analyst", "Translator", "Cultural Programme Coordinator"],
    evidence: RESEARCH,
  },
  {
    name: "Medicine",
    roles: ["Junior Resident", "Clinical Research Coordinator", "Public Health Associate", "Medical Affairs Associate", "Hospital Administration Trainee"],
    evidence: RESEARCH,
  },
  {
    name: "Design",
    roles: ["UI/UX Designer", "Product Designer", "Graphic Designer", "Motion Designer", "Industrial Designer", "Design Researcher"],
    evidence: [...CORE, "github"],
  },
  {
    name: "Commerce",
    roles: ["Accountant", "Audit Associate", "Tax Associate", "Investment Banking Analyst", "Equity Research Analyst", "Finance Executive"],
    evidence: CORE,
  },
  {
    name: "Education",
    roles: ["Academic Content Developer", "Instructional Designer", "School Teacher", "EdTech Curriculum Associate", "Learning Experience Designer"],
    evidence: RESEARCH,
  },
  {
    name: "Agriculture",
    roles: ["Agronomist", "Agri Business Executive", "Food Technologist", "Soil Scientist", "Farm Operations Manager"],
    evidence: RESEARCH,
  },
  {
    name: "Science",
    roles: ["Research Associate", "Lab Analyst", "Data Analyst", "Biotechnologist", "Environmental Scientist", "Quality Assurance Scientist"],
    evidence: [...RESEARCH, "github"],
  },
  {
    name: "Hospitality",
    roles: ["Hotel Operations Trainee", "Food & Beverage Executive", "Guest Relations Executive", "Event Manager", "Travel Consultant"],
    evidence: CORE,
  },
  {
    name: "Architecture",
    roles: ["Junior Architect", "Interior Designer", "Urban Planner", "BIM Modeller", "Landscape Architect"],
    evidence: CORE,
  },
  {
    name: "Media",
    roles: ["Journalist", "Video Editor", "Social Media Manager", "Broadcast Producer", "PR Executive", "Digital Marketing Executive"],
    evidence: CORE,
  },
  {
    name: "Aviation",
    roles: ["Cabin Crew", "Airport Operations Executive", "Aircraft Maintenance Trainee", "Air Traffic Services Trainee", "Airline Ground Staff"],
    evidence: CORE,
  },
  {
    name: "Social Work",
    roles: ["NGO Programme Associate", "Community Development Officer", "CSR Executive", "Policy Research Associate", "Counsellor"],
    evidence: RESEARCH,
  },
];

export const OTHER_ROLE = "Other";

export function getField(name: string): FieldDef | undefined {
  return FIELDS.find((f) => f.name === name);
}

export function rolesForField(name: string): string[] {
  const field = getField(name);
  return field ? [...field.roles, OTHER_ROLE] : [OTHER_ROLE];
}

export function evidenceForField(name: string): EvidenceKey[] {
  return getField(name)?.evidence ?? ["linkedin", "portfolio", "certifications", "internships", "projects", "other_verified"];
}
