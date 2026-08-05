import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type EvidenceVerification = {
  kind: "github" | "leetcode" | "portfolio";
  status: "verified" | "not_found" | "rate_limited" | "unavailable";
  /** Rich value stored in the evidence record and passed to the AI prompt. */
  summary: string;
  message: string;
  preview?: { title?: string; description?: string; image?: string; url?: string };
};

const input = z.object({
  kind: z.enum(["github", "leetcode", "portfolio"]),
  value: z.string().min(1).max(300),
});

/** Verifies a single evidence handle/URL against the real platform, server-side. */
export const verifyEvidence = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }): Promise<EvidenceVerification> => {
    const { verifyGitHub, verifyLeetCode, verifyPortfolio } = await import(
      "@/lib/evidence/verify.server"
    );
    const result =
      data.kind === "github"
        ? await verifyGitHub(data.value)
        : data.kind === "leetcode"
          ? await verifyLeetCode(data.value)
          : await verifyPortfolio(data.value);
    return { kind: data.kind, ...result };
  });
