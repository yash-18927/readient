import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Readient" },
      {
        name: "description",
        content: "Help with sign-in, resume uploads, analysis results and recruiter job creation on Readient.",
      },
      { property: "og:title", content: "Support — Readient" },
      { property: "og:description", content: "Troubleshooting and help resources for Readient users." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Support,
});

function Support() {
  return (
    <LegalPage
      title="Support"
      intro="Common issues and how to resolve them. If something here doesn't help, contact us and we'll take a look."
    >
      <Section heading="Sign-in problems">
        <p>
          If Google sign-in doesn't return you to the app, clear the tab and try again from the sign-in
          page. Email sign-ups need a valid address and a password of at least six characters.
        </p>
      </Section>
      <Section heading="Resume upload fails">
        <p>
          Uploads support PDF, DOCX, TXT and Markdown. If extraction fails, the file may be a scanned
          image — paste your resume text instead.
        </p>
      </Section>
      <Section heading="Analysis takes too long">
        <p>
          Analyses usually complete in under a minute. If it stalls, retry once; repeated failures are
          logged and we can investigate from your account.
        </p>
      </Section>
      <Section heading="Recruiter job creation">
        <p>
          Drop an email or requirement sheet, optionally set the field, role and notes, then review and
          edit the AI draft before publishing the job.
        </p>
      </Section>
    </LegalPage>
  );
}
