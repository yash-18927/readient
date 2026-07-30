import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { failed, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_analyses",
  title: "List resume analyses",
  description:
    "List the signed-in student's saved resume readiness analyses, newest first, with id, field, target role and overall score.",
  inputSchema: {
    limit: z.number().int().describe("How many analyses to return (1-50).").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    const { data, error } = await supabaseForUser(ctx)
      .from("analyses")
      .select("id, field, target_role, overall_score, resume_file_name, created_at")
      .order("created_at", { ascending: false })
      .limit(take);
    if (error) return failed(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { analyses: data ?? [] },
    };
  },
});
