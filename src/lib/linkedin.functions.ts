import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type LinkedInImport = {
  summary: string;
  filesFound: string[];
  filesMissing: string[];
  positions: number;
  skills: number;
  education: number;
};

/** Parses an uploaded LinkedIn "Get a copy of your data" zip entirely server-side. */
export const parseLinkedInExport = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        fileName: z.string().min(1).max(255),
        base64: z.string().min(1).max(14_000_000),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<LinkedInImport> => {
    const lower = data.fileName.toLowerCase();
    const isZip = lower.endsWith(".zip");
    const isCsv = lower.endsWith(".csv");
    if (!isZip && !isCsv) {
      throw new Error(
        "This doesn't look like a LinkedIn data export — upload the .zip from LinkedIn's 'Get a copy of your data', or a single Profile/Positions/Skills/Education CSV.",
      );
    }
    const { parseLinkedInZip, parseLinkedInCsv, LinkedInExportError } = await import(
      "@/lib/linkedin/parse.server"
    );
    try {
      const parsed = isZip ? parseLinkedInZip(data.base64) : parseLinkedInCsv(data.base64);
      return {
        summary: parsed.summary,
        filesFound: parsed.filesFound,
        filesMissing: parsed.filesMissing,
        positions: parsed.positions.length,
        skills: parsed.skills.length,
        education: parsed.education.length,
      };
    } catch (error) {
      if (error instanceof LinkedInExportError) throw new Error(error.message);
      console.error("[linkedin-export]", error);
      throw new Error("We could not read that LinkedIn export. Please try downloading it again.");
    }
  });

