import { unzipSync, strFromU8 } from "fflate";

export class LinkedInExportError extends Error {}

export type LinkedInProfile = {
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  industry?: string;
  location?: string;
};

export type LinkedInPosition = {
  title?: string;
  company?: string;
  location?: string;
  startedOn?: string;
  finishedOn?: string;
  description?: string;
};

export type LinkedInEducation = {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startedOn?: string;
  finishedOn?: string;
};

export type LinkedInExport = {
  profile: LinkedInProfile | null;
  positions: LinkedInPosition[];
  skills: string[];
  education: LinkedInEducation[];
  filesFound: string[];
  filesMissing: string[];
  summary: string;
};

const WANTED = ["profile.csv", "positions.csv", "skills.csv", "education.csv"] as const;

/** Minimal RFC-4180 CSV parser (handles quoted fields, embedded commas/newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** Turns a CSV into records keyed by lowercased header, skipping LinkedIn's preamble notes. */
function toRecords(text: string, expected: string[]): Record<string, string>[] {
  const rows = parseCsv(text);
  if (!rows.length) return [];
  const headerIndex = rows.findIndex((r) =>
    expected.some((key) => r.some((cell) => cell.trim().toLowerCase() === key)),
  );
  const start = headerIndex === -1 ? 0 : headerIndex;
  const header = rows[start]!.map((h) => h.trim().toLowerCase());
  return rows.slice(start + 1).map((r) => {
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = (r[i] ?? "").trim();
    });
    return record;
  });
}

function clean(value?: string) {
  return value && value.trim() ? value.trim() : undefined;
}

function buildSummary(data: Omit<LinkedInExport, "summary">): string {
  const parts: string[] = [];
  const p = data.profile;
  if (p) {
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ");
    const line = [name, p.headline, p.industry, p.location].filter(Boolean).join(" · ");
    if (line) parts.push(`Profile: ${line}`);
    if (p.summary) parts.push(`About: ${p.summary}`);
  }
  if (data.positions.length) {
    parts.push(
      `Experience:\n${data.positions
        .slice(0, 20)
        .map((pos) => {
          const dates = [pos.startedOn, pos.finishedOn || "Present"].filter(Boolean).join(" – ");
          const head = [pos.title, pos.company].filter(Boolean).join(" at ");
          return `  • ${[head, dates, pos.location].filter(Boolean).join(" | ")}${
            pos.description ? ` — ${pos.description.slice(0, 300)}` : ""
          }`;
        })
        .join("\n")}`,
    );
  }
  if (data.education.length) {
    parts.push(
      `Education:\n${data.education
        .slice(0, 10)
        .map((e) => {
          const dates = [e.startedOn, e.finishedOn].filter(Boolean).join(" – ");
          return `  • ${[e.school, e.degree, e.fieldOfStudy, dates].filter(Boolean).join(" | ")}`;
        })
        .join("\n")}`,
    );
  }
  if (data.skills.length) parts.push(`Skills: ${data.skills.slice(0, 80).join(", ")}`);
  return parts.join("\n").slice(0, 12000);
}

/** Builds the export object from whichever LinkedIn CSV texts were found. */
function buildExport(texts: Map<string, string>): LinkedInExport {
  const read = (name: string) => texts.get(name) ?? null;

  let profile: LinkedInProfile | null = null;
  const profileCsv = read("profile.csv");
  if (profileCsv) {
    const row = toRecords(profileCsv, ["first name", "headline"])[0];
    if (row) {
      profile = {
        firstName: clean(row["first name"]),
        lastName: clean(row["last name"]),
        headline: clean(row["headline"]),
        summary: clean(row["summary"]),
        industry: clean(row["industry"]),
        location: clean(row["geo location"]) ?? clean(row["location"]),
      };
    }
  }

  const positionsCsv = read("positions.csv");
  const positions: LinkedInPosition[] = positionsCsv
    ? toRecords(positionsCsv, ["company name", "title"])
        .map((row) => ({
          title: clean(row["title"]),
          company: clean(row["company name"]),
          location: clean(row["location"]),
          startedOn: clean(row["started on"]),
          finishedOn: clean(row["finished on"]),
          description: clean(row["description"]),
        }))
        .filter((row) => row.title || row.company)
    : [];

  const skillsCsv = read("skills.csv");
  const skills = skillsCsv
    ? Array.from(
        new Set(
          toRecords(skillsCsv, ["name", "skill"])
            .map((row) => clean(row["name"]) ?? clean(row["skill"]))
            .filter((value): value is string => Boolean(value)),
        ),
      )
    : [];

  const educationCsv = read("education.csv");
  const education: LinkedInEducation[] = educationCsv
    ? toRecords(educationCsv, ["school name", "degree name"])
        .map((row) => ({
          school: clean(row["school name"]),
          degree: clean(row["degree name"]),
          fieldOfStudy: clean(row["field of study"]) ?? clean(row["notes"]),
          startedOn: clean(row["start date"]) ?? clean(row["started on"]),
          finishedOn: clean(row["end date"]) ?? clean(row["finished on"]),
        }))
        .filter((row) => row.school || row.degree)
    : [];

  const filesFound = (WANTED as readonly string[]).filter((name) => texts.has(name));
  const filesMissing = (WANTED as readonly string[]).filter((name) => !texts.has(name));
  const base = { profile, positions, skills, education, filesFound, filesMissing };
  const summary = buildSummary(base);

  if (!summary) {
    throw new LinkedInExportError(
      "We found LinkedIn files but no readable profile data. Please re-download your export.",
    );
  }

  return { ...base, summary };
}

/** Parses a base64 LinkedIn "Get a copy of your data" zip export. */
export function parseLinkedInZip(base64: string): LinkedInExport {
  let files: Record<string, Uint8Array>;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    files = unzipSync(bytes);
  } catch {
    throw new LinkedInExportError("We could not open that zip file. Please upload the original archive.");
  }

  const texts = new Map<string, string>();
  for (const [path, content] of Object.entries(files)) {
    const base = path.split("/").pop()?.toLowerCase();
    if (base && (WANTED as readonly string[]).includes(base) && !texts.has(base)) {
      texts.set(base, strFromU8(content));
    }
  }

  if (texts.size === 0) {
    throw new LinkedInExportError(
      "This doesn't look like a LinkedIn data export — please upload the zip file from LinkedIn's 'Get a copy of your data' feature.",
    );
  }

  return buildExport(texts);
}

/** Column signatures used to recognise a loose LinkedIn CSV even if it was renamed. */
const CSV_SIGNATURES: { file: string; required: string[] }[] = [
  { file: "positions.csv", required: ["company name", "title"] },
  { file: "education.csv", required: ["school name"] },
  { file: "profile.csv", required: ["first name", "last name"] },
  { file: "skills.csv", required: ["name"] },
];

/** Parses a single loose LinkedIn CSV, detecting its type from the header row. */
export function parseLinkedInCsv(base64: string): LinkedInExport {
  let text: string;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    text = strFromU8(bytes);
  } catch {
    throw new LinkedInExportError("We could not read that CSV file. Please upload the original export.");
  }

  const rows = parseCsv(text);
  const headers = new Set(
    rows
      .slice(0, 5)
      .flat()
      .map((cell) => cell.trim().toLowerCase()),
  );

  const match = CSV_SIGNATURES.find((sig) => sig.required.every((col) => headers.has(col)));
  if (!match) {
    throw new LinkedInExportError(
      "This doesn't look like a LinkedIn export file — upload your LinkedIn data export .zip, or one of its Profile/Positions/Skills/Education CSV files.",
    );
  }

  // skills.csv only has a "name" column; make sure a richer file isn't misread as skills.
  if (match.file === "skills.csv" && (headers.has("company name") || headers.has("school name"))) {
    throw new LinkedInExportError(
      "This doesn't look like a LinkedIn export file — upload your LinkedIn data export .zip instead.",
    );
  }

  return buildExport(new Map([[match.file, text]]));
}


/* ------------------------------------------------------------------ */
/* LinkedIn "Save to PDF" profile export                              */
/* ------------------------------------------------------------------ */

const PDF_HEADINGS = [
  "contact",
  "top skills",
  "skills",
  "languages",
  "certifications",
  "honors-awards",
  "honors & awards",
  "publications",
  "summary",
  "experience",
  "education",
] as const;

function isHeading(line: string): string | null {
  const norm = line.trim().toLowerCase().replace(/\s+/g, " ");
  return (PDF_HEADINGS as readonly string[]).includes(norm) ? norm : null;
}

/** Splits the raw PDF text into { heading -> lines } plus the leading header block. */
function splitPdfSections(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^page \d+ of \d+$/i.test(l));

  const head: string[] = [];
  const sections = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of lines) {
    const heading = isHeading(line);
    if (heading) {
      current = heading === "skills" ? "top skills" : heading;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
    else head.push(line);
  }
  return { head, sections };
}

/** True when the extracted text has the shape of a LinkedIn profile PDF. */
export function looksLikeLinkedInPdf(text: string): boolean {
  const lower = text.toLowerCase();
  const hasProfileUrl = /linkedin\.com\/in\//i.test(text);
  const markers = ["top skills", "contact", "certifications", "experience", "education"].filter(
    (m) => lower.includes(m),
  ).length;
  return (hasProfileUrl && markers >= 2) || markers >= 4;
}

const DATE_RANGE =
  /\(?\b((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)?\s?\d{4})\s*[-–—]\s*(present|(?:[a-z]+\s)?\d{4})\)?/i;

function parseHeaderBlock(head: string[], contactLines: string[]): LinkedInProfile | null {
  const name = head[0];
  if (!name) return null;
  const headline = head[1];
  const location = head[2];
  const email = contactLines.find((l) => /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(l));
  const summaryBits = [email?.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)?.[0]].filter(Boolean);
  return {
    firstName: clean(name.split(" ")[0]),
    lastName: clean(name.split(" ").slice(1).join(" ")),
    headline: clean(headline),
    location: clean(location),
    summary: summaryBits.length ? `Contact: ${summaryBits.join(", ")}` : undefined,
  };
}

const NAME_LINE = /^[A-Z][\p{L}.'-]+(?: [A-Z][\p{L}.'-]+){1,3}$/u;

/**
 * LinkedIn's PDF is two-column, so the name/headline/location block often lands
 * inside a sidebar section instead of at the top of the extracted text.
 */
function parseHeaderFallback(
  sections: Map<string, string[]>,
  contactLines: string[],
): LinkedInProfile | null {
  const lines = Array.from(sections.values()).flat();
  for (let i = 0; i < lines.length - 2; i++) {
    const name = lines[i]!;
    if (!NAME_LINE.test(name)) continue;
    const headline = lines[i + 1]!;
    const location = lines[i + 2]!;
    if (!location.includes(",")) continue;
    // Remove the header lines so they are not mistaken for sidebar entries.
    for (const [key, value] of sections) {
      sections.set(
        key,
        value.filter((l) => l !== name && l !== headline && l !== location),
      );
    }
    return parseHeaderBlock([name, headline, location], contactLines);
  }
  return null;
}

function parsePdfExperience(lines: string[]): LinkedInPosition[] {
  const positions: LinkedInPosition[] = [];
  let company: string | undefined;
  let pending: LinkedInPosition | null = null;

  for (const line of lines) {
    const match = line.match(DATE_RANGE);
    if (match) {
      if (pending) {
        pending.startedOn = clean(match[1]);
        pending.finishedOn = /present/i.test(match[2] ?? "") ? undefined : clean(match[2]);
        positions.push(pending);
        pending = null;
      }
      continue;
    }
    if (!pending) {
      // First unmatched line after a completed entry is the company, next is the title.
      if (!company) {
        company = line;
      } else {
        pending = { title: clean(line), company: clean(company) };
        company = undefined;
      }
    } else if (!pending.location) {
      pending.location = clean(line);
    }
  }
  if (pending) positions.push(pending);
  return positions.filter((p) => p.title || p.company);
}

function parsePdfEducation(lines: string[]): LinkedInEducation[] {
  const education: LinkedInEducation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const school = lines[i]!;
    const next = lines[i + 1];
    if (!next) {
      education.push({ school: clean(school) });
      break;
    }
    const dates = next.match(DATE_RANGE);
    const detail = next.replace(DATE_RANGE, "").replace(/[·|,]\s*$/, "").trim();
    education.push({
      school: clean(school),
      degree: clean(detail.split("·")[0]),
      fieldOfStudy: clean(detail.split("·")[1]),
      startedOn: clean(dates?.[1]),
      finishedOn: clean(dates?.[2]),
    });
    i++;
  }
  return education.filter((e) => e.school);
}

/** Parses a base64 LinkedIn profile PDF ("More › Save to PDF"). */
export async function parseLinkedInPdf(base64: string): Promise<LinkedInExport> {
  let text: string;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    text = Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text;
  } catch {
    throw new LinkedInExportError("We could not read that PDF. Please re-download it from LinkedIn.");
  }

  if (!looksLikeLinkedInPdf(text)) {
    throw new LinkedInExportError(
      "This doesn't look like a LinkedIn profile PDF — open your profile, choose More › Save to PDF, and upload that file.",
    );
  }

  const { head, sections } = splitPdfSections(text);
  const get = (key: string) => sections.get(key) ?? [];

  const profile =
    parseHeaderBlock(head, get("contact")) ?? parseHeaderFallback(sections, get("contact"));
  const skills = Array.from(new Set(get("top skills").map((s) => s.trim()).filter(Boolean)));
  const certifications = get("certifications").map((c) => c.trim()).filter(Boolean);
  const positions = parsePdfExperience(get("experience"));
  const education = parsePdfEducation(get("education"));

  if (profile && certifications.length) {
    profile.summary = [profile.summary, `Certifications: ${certifications.join(", ")}`]
      .filter(Boolean)
      .join("\n");
  }

  const filesFound = ["profile.pdf"];
  const base = { profile, positions, skills, education, filesFound, filesMissing: [] };
  const summary = buildSummary(base);

  if (!summary) {
    throw new LinkedInExportError(
      "We could not read any profile details from that PDF. Please re-download it from LinkedIn.",
    );
  }
  return { ...base, summary };
}
