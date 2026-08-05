import type { ZodType } from "zod";
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

/** Thrown when a provider responds with a status that is worth retrying. */
class ProviderStatusError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const isRetryableStatus = (status: number) => status === 429 || status === 408 || status >= 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


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

type Provider = "gemini" | "openrouter";

async function callProvider(
  provider: Provider,
  model: string,
  system: string,
  user: string,
  apiKey: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(provider === "gemini" ? GATEWAY_URL : OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers:
        provider === "gemini"
          ? {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
              "X-Lovable-AIG-SDK": "fetch",
            }
          : {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
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
      throw new ProviderStatusError(
        `${provider} ${model} failed [${response.status}]: ${body.slice(0, 500)}`,
        response.status,
      );
    }

    const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${provider} ${model} returned no content`);
    return content;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Runs a JSON-returning prompt through Gemini (primary) with an OpenRouter
 * fallback, validating the payload against the supplied zod schema.
 *
 * The primary provider gets one extra attempt on transient statuses (429 rate
 * limit, 408/5xx) before we drop to the fallback, so a single burst of traffic
 * no longer fails the whole submission.
 */
export async function runJsonModel<T>(
  system: string,
  user: string,
  schema: ZodType<T>,
  label = "analysis",
): Promise<{ result: T; model: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!lovableKey && !openRouterKey) throw new AnalysisError("AI is not configured for this project.");

  const attempts: { provider: Provider; model: string; apiKey?: string; retries: number }[] = [
    { provider: "gemini", model: PRIMARY_MODEL, apiKey: lovableKey, retries: 1 },
    { provider: "openrouter", model: FALLBACK_MODEL, apiKey: openRouterKey, retries: 0 },
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    if (!attempt.apiKey) continue;

    for (let tryIndex = 0; tryIndex <= attempt.retries; tryIndex += 1) {
      try {
        const raw = await callProvider(attempt.provider, attempt.model, system, user, attempt.apiKey);
        const parsed = schema.safeParse(extractJson(raw));
        if (!parsed.success) {
          throw new Error(
            `Invalid AI shape from ${attempt.model}: ${parsed.error.issues.slice(0, 3).map((i) => i.path.join(".")).join(", ")}`,
          );
        }
        // Reported back to the caller and persisted in analysis_logs.model.
        return { result: parsed.data, model: `${attempt.provider}:${attempt.model}` };
      } catch (error) {
        console.error(`[${label}] ${attempt.provider} attempt ${tryIndex + 1} failed`, error);
        lastError = error;

        const retryable = error instanceof ProviderStatusError && isRetryableStatus(error.status);
        if (!retryable || tryIndex === attempt.retries) break;
        await sleep(1200 * (tryIndex + 1));
      }
    }
  }

  console.error(`[${label}] all providers failed`, lastError);

  if (lastError instanceof ProviderStatusError) {
    if (lastError.status === 429) {
      throw new AnalysisError(
        "Our AI is handling a lot of requests right now. Wait about a minute and try again — nothing you entered was lost.",
      );
    }
    if (lastError.status === 402) {
      throw new AnalysisError(
        "AI credits for this workspace have run out. The site owner needs to top up before new scans can run.",
      );
    }
  }

  throw new AnalysisError(
    "The analysis could not be completed — both the primary and fallback AI providers failed. Please try again in a few minutes.",
  );
}


export async function runAnalysisModel(
  input: AnalysisInput,
): Promise<{ result: AnalysisResult; model: string }> {
  // Build the prompt once and reuse it for whichever provider serves the request.
  const { system, user } = buildAnalysisPrompt(input);
  return runJsonModel(system, user, analysisResultSchema);
}

