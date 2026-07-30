import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Readient" },
      {
        name: "description",
        content: "The terms that apply when you use Readient for career readiness analysis, job creation or candidate ranking.",
      },
      { property: "og:title", content: "Terms of Service — Readient" },
      { property: "og:description", content: "Acceptable use, accounts and limitations for the Readient platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="By using Readient you agree to the terms below. They are maintained by the Readient team and may be updated as the product evolves."
    >
      <Section heading="Your account">
        <p>
          You are responsible for the accuracy of the information in your account and for keeping
          your credentials secure. Roles (student or recruiter) determine which workspace features
          you can use.
        </p>
      </Section>
      <Section heading="Acceptable use">
        <p>
          Do not submit content you have no right to share, attempt to disrupt the service, or use
          the platform to misrepresent candidates or roles.
        </p>
      </Section>
      <Section heading="AI-generated output">
        <p>
          Scores, roadmaps, job drafts and rankings are AI-generated guidance, not guarantees of
          hiring outcomes. Review results before acting on them.
        </p>
      </Section>
      <Section heading="Availability and changes">
        <p>
          Features may change, and the service is provided on an as-available basis while the
          platform is in active development.
        </p>
      </Section>
    </LegalPage>
  );
}
