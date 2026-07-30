import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listAnalysesTool from "./tools/list-analyses";
import getAnalysisTool from "./tools/get-analysis";

// Must be the direct Supabase host (the publish-time proxy URL fails RFC 8414 issuer checks).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "career-compass",
  title: "Career Compass",
  version: "0.1.0",
  instructions:
    "Tools for Career Compass (PlacementIQ), an AI placement readiness platform. Use `get_profile` for the signed-in user's role, `list_analyses` to browse their saved resume readiness analyses, and `get_analysis` to read one full analysis result.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfileTool, listAnalysesTool, getAnalysisTool],
});
