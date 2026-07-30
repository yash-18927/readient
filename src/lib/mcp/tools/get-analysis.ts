import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failed, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_analysis",
  title: "Get a resume analysis",
  description:
    "Get the full result of one saved resume readiness analysis (pillar scores, ATS audit, roadmap, interview prep) by its id.",
  inputSchema: {
    id: z.string().describe("The analysis id, as returned by list_analyses."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("analyses")
      .select("id, field, target_role, overall_score, job_description, result, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return failed(error.message);
    if (!data) return failed("No analysis found with that id.");
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { analysis: data },
    };
  },
});
