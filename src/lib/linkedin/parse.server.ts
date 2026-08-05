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

/** Parses a base64 LinkedIn "Get a copy of your data" zip export. */
export function parseLinkedInZip(base64: string): LinkedInExport {
  let files: Record<string, Uint8Array>;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    files = unzipSync(bytes);
  } catch {
    throw new LinkedInExportError("We could not open that zip file. Please upload the original archive.");
  }

  const byName = new Map<string, Uint8Array>();
  for (const [path, content] of Object.entries(files)) {
    const base = path.split("/").pop()?.toLowerCase();
    if (base && (WANTED as readonly string[]).includes(base) && !byName.has(base)) {
      byName.set(base, content);
    }
  }

  if (byName.size === 0) {
    throw new LinkedInExportError(
      "This doesn't look like a LinkedIn data export — please upload the zip file from LinkedIn's 'Get a copy of your data' feature.",
    );
  }

  const read = (name: string) => {
    const raw = byName.get(name);
    return raw ? strFromU8(raw) : null;
  };

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

  const filesFound = (WANTED as readonly string[]).filter((name) => byName.has(name));
  const filesMissing = (WANTED as readonly string[]).filter((name) => !byName.has(name));
  const base = { profile, positions, skills, education, filesFound, filesMissing };
  const summary = buildSummary(base);

  if (!summary) {
    throw new LinkedInExportError(
      "We found LinkedIn files in that zip but no readable profile data. Please re-download your export.",
    );
  }

  return { ...base, summary };
}
