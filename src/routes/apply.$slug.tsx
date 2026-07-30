import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/analysis/results/primitives";
import { CandidateReport } from "@/components/jobs/candidate-report";
import type { AnalysisResult } from "@/lib/analysis/schema";
import {
  extractPublicResume,
  getPublicJob,
  submitApplication,
} from "@/lib/public-jobs.functions";

export const Route = createFileRoute("/apply/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply for this role — PlacementIQ" },
      {
        name: "description",
        content: "Upload your resume and get an instant AI fit score for this job — no account needed.",
      },
      { property: "og:title", content: "Apply for this role — PlacementIQ" },
      {
        property: "og:description",
        content: "Upload your resume and get an instant AI fit score for this job — no account needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyPage,
});

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function ApplyPage() {
  const { slug } = Route.useParams();
  const jobFn = useServerFn(getPublicJob);
  const extractFn = useServerFn(extractPublicResume);
  const submitFn = useServerFn(submitApplication);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<{ score: number; result: AnalysisResult } | null>(null);

  const job = useQuery({ queryKey: ["public-job", slug], queryFn: () => jobFn({ data: { slug } }) });

  const extraction = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      const { text } = await extractFn({ data: { fileName: file.name, base64 } });
      return text;
    },
    onSuccess: (text) => setResumeText(text),
    onError: (error) =>
      toast.error("Could not read that file", {
        description: error instanceof Error ? error.message : "Try a PDF, DOCX, or TXT file.",
      }),
  });

  const submission = useMutation({
    mutationFn: () =>
      submitFn({
        data: {
          slug,
          candidateName: name.trim() || undefined,
          candidateEmail: email.trim() || undefined,
          links: {
            ...(github.trim() ? { github: github.trim() } : {}),
            ...(portfolio.trim() ? { portfolio: portfolio.trim() } : {}),
          },
          resumeText,
          resumeFileName: fileName,
        },
      }),
    onSuccess: (data) => setOutcome({ score: data.score, result: data.result }),
    onError: (error) =>
      toast.error("Submission failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  if (job.isLoading) {
    return <CenteredNotice title="Loading role…" body="Fetching the job posting." />;
  }

  if (!job.data?.job) {
    return (
      <CenteredNotice
        title="This job link is not valid"
        body="The posting may have been removed. Ask the recruiter for an up-to-date link."
      />
    );
  }

  const posting = job.data.job;

  if (!posting.accepting) {
    return (
      <CenteredNotice
        title={`${posting.title} is no longer accepting applications`}
        body="This posting has been closed or its deadline has passed."
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          PlacementIQ
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{posting.title}</h1>
        <p className="mt-1 text-muted-foreground">
          {posting.company || "Confidential company"} · {posting.requirements.experience_level}
        </p>
      </header>

      {outcome ? (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-8 text-center">
              <p className="text-5xl font-bold tabular-nums">{outcome.score}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your fit score for {posting.title} — your application has been sent to the recruiter.
              </p>
            </CardContent>
          </Card>
          <CandidateReport result={outcome.result} />
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About the role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>{posting.requirements.summary}</p>
              {posting.requirements.responsibilities.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {posting.requirements.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                {posting.requirements.required_skills.map((skill) => (
                  <Chip key={skill} tone="neutral">
                    {skill}
                  </Chip>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cand-name">Full name (optional)</Label>
                  <Input id="cand-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cand-email">Email (optional)</Label>
                  <Input
                    id="cand-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cand-github">GitHub (optional)</Label>
                  <Input id="cand-github" value={github} onChange={(e) => setGithub(e.target.value)} maxLength={500} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cand-portfolio">Portfolio / LinkedIn (optional)</Label>
                  <Input
                    id="cand-portfolio"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cand-file">Resume (PDF, DOCX or TXT)</Label>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" disabled={extraction.isPending}>
                    <label htmlFor="cand-file" className="cursor-pointer">
                      {extraction.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 size-4" />
                      )}
                      {extraction.isPending ? "Reading…" : "Upload resume"}
                    </label>
                  </Button>
                  {fileName && (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-4" /> {fileName}
                    </span>
                  )}
                </div>
                <input
                  id="cand-file"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setFileName(file.name);
                    extraction.mutate(file);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cand-text">Resume text</Label>
                <Textarea
                  id="cand-text"
                  rows={10}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Upload a file above, or paste your resume text here."
                />
                <p className="text-xs text-muted-foreground">{resumeText.length} characters (minimum 100)</p>
              </div>

              <div className="flex justify-end">
                <Button
                  disabled={resumeText.trim().length < 100 || submission.isPending}
                  onClick={() => submission.mutate()}
                >
                  {submission.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {submission.isPending ? "Scoring your resume…" : "Submit application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function CenteredNotice({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6" variant="outline">
        <Link to="/">Back to PlacementIQ</Link>
      </Button>
    </main>
  );
}
