import { analysisResultSchema, type AnalysisResult, type AnalysisInput } from "./schema";
import { buildAnalysisPrompt } from "./prompt.server";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const PRIMARY_MODEL = "google/gemini-3.6-flash";
// Fallback: OpenRouter free-tier model selected 2026-07-30.
// Free models can be rotated/removed without notice — if this 404s, swap it for
// another ":free" model from https://openrouter.ai/models?order=pricing-low-to-high
const FALLBACK_MODEL = "deepseek/deepseek-chat-v3-0324:free";
const TIMEOUT_MS = 120_000;

export class AnalysisError extends Error {}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new AnalysisError("The AI returned a response we could not read.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function callModel(model: string, system: string, user: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new AnalysisError("The analysis service is busy right now. Please retry in a moment.");
      if (response.status === 402) throw new AnalysisError("AI credits are exhausted. Add credits to continue analysing resumes.");
      throw new Error(`Gateway ${model} failed [${response.status}]: ${body}`);
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error(`Gateway ${model} returned no content`);
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export async function runAnalysisModel(
  input: AnalysisInput,
): Promise<{ result: AnalysisResult; model: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new AnalysisError("AI is not configured for this project.");

  const { system, user } = buildAnalysisPrompt(input);
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError: unknown;

  for (const model of models) {
    try {
      const raw = await callModel(model, system, user, apiKey);
      const parsed = analysisResultSchema.safeParse(extractJson(raw));
      if (!parsed.success) {
        throw new Error(`Invalid AI shape from ${model}: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join(".")).join(", ")}`);
      }
      return { result: parsed.data, model };
    } catch (error) {
      if (error instanceof AnalysisError) throw error;
      console.error("[analysis]", error);
      lastError = error;
    }
  }

  console.error("[analysis] all models failed", lastError);
  throw new AnalysisError("The analysis could not be completed. Please try again in a moment.");
}
