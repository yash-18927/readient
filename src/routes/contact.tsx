import { createFileRoute } from "@tanstack/react-router";
import { Mail, Github, Linkedin } from "lucide-react";
import { LegalPage, Section } from "@/components/legal-page";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Readient" },
      {
        name: "description",
        content: "Get in touch with the Readient team about partnerships, feedback or platform questions.",
      },
      { property: "og:title", content: "Contact — Readient" },
      { property: "og:description", content: "Reach the Readient team by email or social channels." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

const channels = [
  { icon: Mail, label: "Email", value: "hello@readient.app", href: "mailto:hello@readient.app" },
  { icon: Github, label: "GitHub", value: "github.com", href: "https://github.com" },
  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com", href: "https://linkedin.com" },
];

function Contact() {
  return (
    <LegalPage
      title="Contact"
      intro="Questions about the platform, feedback on your analysis, or interested in using Readient with your institution? Reach out."
    >
      <Section heading="Ways to reach us">
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((channel) => (
            <a
              key={channel.label}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="surface-card flex flex-col gap-2 p-5"
            >
              <channel.icon className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{channel.label}</span>
              <span className="text-xs text-muted-foreground">{channel.value}</span>
            </a>
          ))}
        </div>
      </Section>
      <Section heading="Response times">
        <p>We aim to reply to messages within two business days.</p>
      </Section>
    </LegalPage>
  );
}
