/** Server-only verification helpers for evidence fields (GitHub, LeetCode, portfolio). */

export type VerifyStatus = "verified" | "not_found" | "rate_limited" | "unavailable";

export type VerifyResult = {
  status: VerifyStatus;
  /** One-line summary written into the evidence value and the AI prompt. */
  summary: string;
  message: string;
  preview?: { title?: string; description?: string; image?: string; url?: string };
};

const UA = { "User-Agent": "Readient-Analysis/1.0" };

function timeout(ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(id) };
}

export async function verifyGitHub(usernameRaw: string): Promise<VerifyResult> {
  const username = usernameRaw.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/+$/, "");
  if (!/^[A-Za-z0-9-]{1,39}$/.test(username)) {
    return { status: "not_found", summary: `${usernameRaw} (unverified — not a valid GitHub username)`, message: "That doesn't look like a GitHub username." };
  }

  const token = process.env["GITHUB_API_TOKEN"];
  const headers: Record<string, string> = {
    ...UA,
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const t = timeout(10_000);
  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      signal: t.signal,
    });

    if (userRes.status === 404) {
      return {
        status: "not_found",
        summary: `${username} (unverified — GitHub user does not exist)`,
        message: "No GitHub user with that username.",
      };
    }
    if (userRes.status === 403 || userRes.status === 429) {
      return {
        status: "rate_limited",
        summary: `${username} (unverified — GitHub rate limit reached)`,
        message: "GitHub rate limit reached — try again shortly.",
      };
    }
    if (!userRes.ok) {
      return {
        status: "unavailable",
        summary: `${username} (unverified — GitHub lookup failed)`,
        message: `GitHub lookup failed (${userRes.status}).`,
      };
    }

    const user = (await userRes.json()) as {
      login: string;
      name?: string | null;
      public_repos?: number;
      followers?: number;
      created_at?: string;
    };

    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
      { headers, signal: t.signal },
    );
    const repos = reposRes.ok
      ? ((await reposRes.json()) as Array<{
          name: string;
          fork: boolean;
          language: string | null;
          stargazers_count: number;
          pushed_at: string;
        }>)
      : [];

    const own = repos.filter((r) => !r.fork);
    const langCount = new Map<string, number>();
    for (const r of own) if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
    const languages = [...langCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l]) => l);
    const lastPush = own.map((r) => r.pushed_at).sort().at(-1);
    const stars = own.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const recent = own
      .slice()
      .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1))
      .slice(0, 5)
      .map((r) => `${r.name}${r.language ? ` (${r.language})` : ""}`);

    const summary = [
      `github.com/${user.login} — VERIFIED via GitHub API`,
      `public repos: ${user.public_repos ?? own.length}`,
      `non-fork repos analysed: ${own.length}`,
      `followers: ${user.followers ?? 0}`,
      `total stars on own repos: ${stars}`,
      languages.length ? `primary languages: ${languages.join(", ")}` : "primary languages: none detected",
      lastPush ? `last push: ${lastPush.slice(0, 10)}` : "last push: unknown",
      recent.length ? `recent repos: ${recent.join("; ")}` : "",
      user.created_at ? `account created: ${user.created_at.slice(0, 10)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      status: "verified",
      summary,
      message: `Verified — ${own.length} repos${languages.length ? `, mostly ${languages[0]}` : ""}${lastPush ? `, last push ${lastPush.slice(0, 10)}` : ""}.`,
    };
  } catch (error) {
    console.error("[verify-github]", error);
    return {
      status: "unavailable",
      summary: `${username} (unverified — GitHub unreachable)`,
      message: "Could not reach GitHub just now.",
    };
  } finally {
    t.done();
  }
}

export async function verifyLeetCode(usernameRaw: string): Promise<VerifyResult> {
  const username = usernameRaw.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?leetcode\.com\/(u\/)?/i, "").replace(/\/+$/, "");
  if (!username) {
    return { status: "not_found", summary: "(unverified)", message: "Enter a LeetCode username." };
  }

  const query = `query userStats($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
    }
  }`;

  const t = timeout(10_000);
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({ query, variables: { username } }),
      signal: t.signal,
    });

    if (res.status === 429) {
      return {
        status: "rate_limited",
        summary: `${username} (unverified — LeetCode rate limited)`,
        message: "LeetCode rate limited — try again shortly.",
      };
    }
    if (!res.ok) {
      return {
        status: "unavailable",
        summary: `${username} (unverified — LeetCode lookup unavailable)`,
        message: "LeetCode lookup unavailable right now.",
      };
    }

    const json = (await res.json()) as {
      data?: {
        matchedUser?: {
          username: string;
          profile?: { ranking?: number | null; reputation?: number | null };
          submitStatsGlobal?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> };
        } | null;
      };
    };

    const matched = json.data?.matchedUser;
    if (!matched) {
      return {
        status: "not_found",
        summary: `${username} (unverified — LeetCode user does not exist)`,
        message: "No LeetCode user with that username.",
      };
    }

    const nums = matched.submitStatsGlobal?.acSubmissionNum ?? [];
    const by = (d: string) => nums.find((n) => n.difficulty.toLowerCase() === d)?.count ?? 0;
    const summary = [
      `leetcode.com/u/${matched.username} — VERIFIED via LeetCode GraphQL`,
      `solved total: ${by("all")}`,
      `easy: ${by("easy")}`,
      `medium: ${by("medium")}`,
      `hard: ${by("hard")}`,
      matched.profile?.ranking ? `global ranking: ${matched.profile.ranking}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      status: "verified",
      summary,
      message: `Verified — ${by("all")} solved (${by("medium")} medium, ${by("hard")} hard).`,
    };
  } catch (error) {
    console.error("[verify-leetcode]", error);
    return {
      status: "unavailable",
      summary: `${username} (unverified — LeetCode unreachable)`,
      message: "LeetCode is unreachable right now — analysis will treat this as unverified.",
    };
  } finally {
    t.done();
  }
}

function metaTag(html: string, attr: "property" | "name", value: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${value}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${value}["']`,
    "i",
  );
  const m = html.match(re);
  const raw = m?.[1] ?? m?.[2];
  return raw ? decodeEntities(raw.trim()) : undefined;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function verifyPortfolio(urlRaw: string): Promise<VerifyResult> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(urlRaw.trim()) ? urlRaw.trim() : `https://${urlRaw.trim()}`);
  } catch {
    return { status: "not_found", summary: `${urlRaw} (unverified — invalid URL)`, message: "That doesn't look like a valid URL." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { status: "not_found", summary: `${urlRaw} (unverified — unsupported URL)`, message: "Only http(s) URLs are supported." };
  }

  const t = timeout(10_000);
  try {
    const res = await fetch(url.toString(), {
      headers: { ...UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: t.signal,
    });
    if (!res.ok) {
      return {
        status: "unavailable",
        summary: `${url.toString()} (unverified — returned HTTP ${res.status})`,
        message: `The page returned HTTP ${res.status}.`,
      };
    }

    const html = (await res.text()).slice(0, 300_000);
    const title =
      metaTag(html, "property", "og:title") ??
      metaTag(html, "name", "twitter:title") ??
      (decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "") || undefined);
    const description =
      metaTag(html, "property", "og:description") ??
      metaTag(html, "name", "description") ??
      metaTag(html, "name", "twitter:description");
    let image = metaTag(html, "property", "og:image") ?? metaTag(html, "name", "twitter:image");
    if (image) {
      try {
        image = new URL(image, url).toString();
      } catch {
        image = undefined;
      }
    }

    const summary = [
      `${url.toString()} — VERIFIED live (HTTP ${res.status})`,
      title ? `page title: ${title}` : "",
      description ? `meta description: ${description.slice(0, 300)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      status: "verified",
      summary,
      message: "Live — we read this page successfully.",
      preview: { title, description, image, url: url.toString() },
    };
  } catch (error) {
    console.error("[verify-portfolio]", error);
    return {
      status: "unavailable",
      summary: `${url.toString()} (unverified — unreachable)`,
      message: "We couldn't reach that URL — it will be treated as unverified.",
    };
  } finally {
    t.done();
  }
}
