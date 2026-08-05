/**
 * Client-side parser for LinkedIn's official data export.
 *
 * LinkedIn exports a folder of CSV files (Profile.csv, Positions.csv,
 * Skills.csv, Education.csv, Projects.csv, Certifications.csv, …). We read the
 * files we care about and flatten them into a short plain-text summary that is
 * passed to the analysis prompt as the `linkedin` evidence value.
 */

const MAX_SUMMARY_CHARS = 6000;
const MAX_ROWS_PER_FILE = 25;

/** Minimal RFC-4180 CSV reader (handles quoted fields and embedded newlines). */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  const text = input.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

function toRecords(csv: string): Record<string, string>[] {
  const rows = parseCsv(csv);
  // LinkedIn prefixes some files with a "Notes:" preamble before the header row.
  const headerIndex = rows.findIndex((cells) => cells.length > 1);
  if (headerIndex === -1) return [];
  const header = rows[headerIndex].map((cell) => cell.trim());
  return rows.slice(headerIndex + 1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = (cells[index] ?? "").trim();
    });
    return record;
  });
}

const pick = (record: Record<string, string>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value) return value;
  }
  return "";
};

type Section = { title: string; lines: string[] };

function summariseFile(fileName: string, csv: string): Section | null {
  const name = fileName.toLowerCase();
  const records = toRecords(csv).slice(0, MAX_ROWS_PER_FILE);
  if (records.length === 0) return null;

  if (name.includes("profile")) {
    const profile = records[0];
    const lines = [
      pick(profile, ["First Name"]) || pick(profile, ["Last Name"])
        ? `Name: ${[pick(profile, ["First Name"]), pick(profile, ["Last Name"])].filter(Boolean).join(" ")}`
        : "",
      pick(profile, ["Headline"]) ? `Headline: ${pick(profile, ["Headline"])}` : "",
      pick(profile, ["Industry"]) ? `Industry: ${pick(profile, ["Industry"])}` : "",
      pick(profile, ["Geo Location", "Location"]) ? `Location: ${pick(profile, ["Geo Location", "Location"])}` : "",
      pick(profile, ["Summary"]) ? `Summary: ${pick(profile, ["Summary"])}` : "",
    ].filter(Boolean);
    return lines.length ? { title: "Profile", lines } : null;
  }

  if (name.includes("position")) {
    return {
      title: "Experience",
      lines: records.map((r) =>
        [
          pick(r, ["Title"]),
          pick(r, ["Company Name"]),
          [pick(r, ["Started On"]), pick(r, ["Finished On"]) || "Present"].filter(Boolean).join(" – "),
          pick(r, ["Description"]),
        ]
          .filter(Boolean)
          .join(" · "),
      ),
    };
  }

  if (name.includes("education")) {
    return {
      title: "Education",
      lines: records.map((r) =>
        [pick(r, ["School Name"]), pick(r, ["Degree Name"]), pick(r, ["Notes"])].filter(Boolean).join(" · "),
      ),
    };
  }

  if (name.includes("skill")) {
    return { title: "Skills", lines: [records.map((r) => pick(r, ["Name"])).filter(Boolean).join(", ")] };
  }

  if (name.includes("project")) {
    return {
      title: "Projects",
      lines: records.map((r) => [pick(r, ["Title"]), pick(r, ["Description"])].filter(Boolean).join(" · ")),
    };
  }

  if (name.includes("certification")) {
    return {
      title: "Certifications",
      lines: records.map((r) => [pick(r, ["Name"]), pick(r, ["Authority"])].filter(Boolean).join(" · ")),
    };
  }

  if (name.includes("honor") || name.includes("award")) {
    return {
      title: "Honours",
      lines: records.map((r) => [pick(r, ["Title"]), pick(r, ["Description"])].filter(Boolean).join(" · ")),
    };
  }

  if (name.includes("publication")) {
    return {
      title: "Publications",
      lines: records.map((r) => [pick(r, ["Name"]), pick(r, ["Publisher"])].filter(Boolean).join(" · ")),
    };
  }

  return null;
}

export type LinkedInParseResult = { summary: string; sections: string[] };

/** Turns one or more LinkedIn export CSV files into a compact evidence summary. */
export function summariseLinkedInExport(files: { name: string; text: string }[]): LinkedInParseResult {
  const sections: Section[] = [];

  for (const file of files) {
    const section = summariseFile(file.name, file.text);
    if (!section) continue;
    const lines = section.lines.map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    sections.push({ title: section.title, lines });
  }

  const summary = sections
    .map((section) => `${section.title}:\n${section.lines.map((line) => `  • ${line}`).join("\n")}`)
    .join("\n")
    .slice(0, MAX_SUMMARY_CHARS);

  return { summary, sections: sections.map((s) => s.title) };
}
