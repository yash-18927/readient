import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://readient.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/get-started", changefreq: "monthly", priority: "0.8" },
          { path: "/student", changefreq: "weekly", priority: "0.8" },
          { path: "/recruiter", changefreq: "weekly", priority: "0.8" },
        ];

        try {
          const { createPublicClient } = await import("@/lib/jobs/public-client.server");
          const supabase = createPublicClient();
          const { data: jobs } = await supabase.rpc("public_jobs_list");
          if (jobs) {
            for (const job of jobs) {
              entries.push({
                path: `/apply/${job.share_slug}`,
                lastmod: job.updated_at
                  ? new Date(job.updated_at).toISOString().split("T")[0]
                  : undefined,
                changefreq: "weekly",
                priority: "0.6",
              });
            }
          }
        } catch (error) {
          console.error("[sitemap] failed to list public jobs", error);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
