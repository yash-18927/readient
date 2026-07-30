import { defineTool } from "@lovable.dev/mcp-js";
import { failed, supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "get_profile",
  title: "Get my profile",
  description:
    "Get the signed-in user's PlacementIQ profile: full name and role (student or recruiter).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("full_name, role, created_at")
      .eq("user_id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return failed(error.message);
    if (!data) return failed("No profile found for this account.");
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { profile: data },
    };
  },
});
