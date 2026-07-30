import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Briefcase,
  FileCheck2,
  FileSearch,
  Gauge,
  Github,
  History,
  LayoutDashboard,
  MessagesSquare,
  Route as RouteIcon,
  Sparkles,
  Star,
  Target,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Readient — Become Placement Ready. Faster." },
      {
        name: "description",
        content:
          "Readient is an AI career readiness platform: resume analysis, GitHub skill intelligence, placement readiness scores, personalized roadmaps and interview prep.",
      },
      { property: "og:title", content: "Readient — Become Placement Ready. Faster." },
      {
        property: "og:description",
        content:
          "AI-powered resume and readiness analysis for students, plus AI job posting and candidate ranking for recruiters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const trustFeatures = [
  {
    icon: FileSearch,
    title: "AI-powered Resume Analysis",
    body: "Deep parsing of your resume against real hiring expectations for your target role.",
  },
  {
    icon: Github,
    title: "GitHub Skill Intelligence",
    body: "Evidence from your projects and code, translated into verifiable skill signals.",
  },
  {
    icon: Gauge,
    title: "Placement Readiness Score",
    body: "A weighted, explainable score across six pillars so you know where you stand.",
  },
  {
    icon: RouteIcon,
    title: "Personalized Career Roadmaps",
    body: "A sequenced plan that closes your highest-impact gaps first.",
  },
  {
    icon: FileCheck2,
    title: "ATS Resume Evaluation",
    body: "Eight-factor ATS audit with concrete, line-level fixes before you apply.",
  },
  {
    icon: MessagesSquare,
    title: "Interview Preparation",
    body: "Role-specific question sets and talking points drawn from your own profile.",
  },
];

const studentSteps = [
  { icon: FileSearch, title: "Share your profile", body: "Add your resume and target roles." },
  {
    icon: BrainCircuit,
    title: "Get an AI readiness read",
    body: "See skill gaps scored against real job requirements.",
  },
  { icon: Target, title: "Close the gaps", body: "Follow focused guidance until you're placement ready." },
];

const recruiterSteps = [
  { icon: Sparkles, title: "Post a role with AI", body: "Turn a rough brief into a structured job posting." },
  { icon: Users2, title: "Rank candidates", body: "Applicants are scored against the role automatically." },
  { icon: Target, title: "Shortlist with evidence", body: "Every ranking comes with a reason you can defend." },
];

const roadmap = [
  { icon: Briefcase, title: "Company Role Matching", body: "Match your profile to live roles by fit." },
  { icon: FileCheck2, title: "Resume ATS Checker", body: "Standalone ATS scoring for any resume." },
  { icon: LayoutDashboard, title: "Career Dashboard", body: "One home for progress and next actions." },
  { icon: BarChart3, title: "Analytics", body: "Track readiness trends over time." },
  { icon: FileSearch, title: "Reports", body: "Shareable, exportable readiness reports." },
  { icon: History, title: "History", body: "Every analysis, versioned and comparable." },
  { icon: Star, title: "Success Stories", body: "Outcomes from students who got placed." },
];

const faqs = [
  {
    q: "What does Readient actually analyze?",
    a: "Your resume, target role, skills and project evidence — scored against the expectations of real job descriptions in your domain.",
  },
  {
    q: "Do I need an account to try it?",
    a: "You can set up your analysis first. You'll be asked to sign in only when you run it, so your results are saved to your history.",
  },
  {
    q: "Which academic domains are supported?",
    a: "Multiple domains including engineering, pharmacy, law, management and more, each with role-specific criteria.",
  },
  {
    q: "How do recruiters use Readient?",
    a: "Recruiters turn briefs, emails or requirement sheets into structured job postings, then get applicants ranked with defensible reasoning.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="hero-glow" />
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center animate-fade-in">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground shadow-soft backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Readient AI · Career readiness platform
              </p>
              <h1 className="mt-8 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Become Placement Ready. Faster.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                AI-powered career readiness platform that analyzes resumes, GitHub profiles, skills,
                and experience to generate personalized roadmaps, skill-gap analysis, placement
                readiness scores, and interview preparation for multiple academic domains.
              </p>
              <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="btn-primary-gradient h-12 w-full rounded-xl px-7 sm:w-auto">
                  <Link to="/student">
                    Start Analysis <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="btn-ghost-fill h-12 w-full rounded-xl px-7 sm:w-auto">
                  <Link to="/" hash="features">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust / features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to be hire-ready
            </h2>
            <p className="mt-3 text-muted-foreground">
              Six capabilities, one continuous readiness loop.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trustFeatures.map((feature) => (
              <article key={feature.title} className="surface-card p-7">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-6 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-20 sm:pb-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-3 text-muted-foreground">One platform, two very different jobs to be done.</p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <AudienceCard title="For students" caption="Turn a resume into a plan" steps={studentSteps} />
            <AudienceCard title="For recruiters" caption="Turn applicants into a shortlist" steps={recruiterSteps} />
          </div>
        </section>

        {/* Roadmap placeholders */}
        <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">On the roadmap</h2>
            <p className="mt-3 text-muted-foreground">
              Modules we're building next on top of the readiness engine.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((item) => (
              <article key={item.title} className="surface-card border-dashed p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <item.icon className="size-4" />
                  </span>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
                <span className="mt-4 inline-block rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Coming soon
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((faq) => (
              <AccordionItem key={faq.q} value={faq.q} className="border-border">
                <AccordionTrigger className="text-left text-sm font-semibold">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function AudienceCard({
  title,
  caption,
  steps,
}: {
  title: string;
  caption: string;
  steps: { icon: typeof Target; title: string; body: string }[];
}) {
  return (
    <div className="surface-card p-8">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{caption}</p>
      <ol className="mt-8 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <step.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
