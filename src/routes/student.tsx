import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeForm, type ResumeFormValues } from "@/components/analysis/resume-form";
import { HistoryList } from "@/components/analysis/history-list";
import { ResultsDashboard } from "@/components/analysis/results/results-dashboard";
import { setPendingRole, useProfile, useSession } from "@/lib/auth";
import {
  analyzeResume,
  deleteAnalysis,
  extractResume,
  listAnalyses,
  type AnalysisRecord,
} from "@/lib/analysis.functions";

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student workspace — Readient" },
      { name: "description", content: "Upload your resume and get an AI placement readiness score." },
      { property: "og:title", content: "Student workspace — Readient" },
      {
        property: "og:description",
        content: "Upload your resume and get an AI placement readiness score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StudentDashboard,
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

function StudentDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, loading } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const signedIn = Boolean(session);

  const extractFn = useServerFn(extractResume);
  const analyzeFn = useServerFn(analyzeResume);
  const deleteFn = useServerFn(deleteAnalysis);
  const listFn = useServerFn(listAnalyses);

  const [tab, setTab] = useState("analyse");
  const [active, setActive] = useState<AnalysisRecord | null>(null);
  const [prefill, setPrefill] = useState<ResumeFormValues | null>(null);

  // Recruiters land on their own workspace.
  useEffect(() => {
    if (profile && profile.role === "recruiter") navigate({ to: "/recruiter", replace: true });
  }, [profile, navigate]);

  const history = useQuery({
    queryKey: ["analyses"],
    queryFn: () => listFn({}),
    enabled: signedIn,
  });

  function goToAuth(mode: "signin" | "signup") {
    setPendingRole("student");
    navigate({ to: "/auth", search: { role: "student", mode } });
  }

  const extraction = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      const { text } = await extractFn({ data: { fileName: file.name, base64 } });
      return text;
    },
  });

  const analysis = useMutation({
    mutationFn: (values: ResumeFormValues) => analyzeFn({ data: values }),
    onSuccess: (record) => {
      setActive(record);
      setTab("results");
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Analysis complete");
    },
    onError: (error) =>
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const removal = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });

  function reanalyzeFrom(record: AnalysisRecord) {
    setPrefill({
      field: record.field,
      targetRole: record.target_role,
      jobDescription: record.job_description ?? "",
      evidence: record.evidence ?? {},
      resumeText: record.resume_text,
      resumeFileName: record.resume_file_name ?? undefined,
    });
    setTab("analyse");
  }

  function handleSubmit(values: ResumeFormValues) {
    if (!signedIn) {
      setPrefill(values);
      toast.info("Sign in to run your analysis", {
        description: "Your inputs are kept so you can pick up right where you left off.",
      });
      goToAuth("signup");
      return;
    }
    analysis.mutate(values);
  }

  return (
    <DashboardLayout
      profile={profile ?? null}
      signedIn={signedIn}
      role="student"
      title={
        signedIn && profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "Student workspace"
      }
      subtitle="Upload your resume and get an AI readiness breakdown for your target role."
      navItems={[{ label: "Overview", active: true }, { label: "Resume" }, { label: "Readiness" }]}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print">
          <TabsTrigger value="analyse">New analysis</TabsTrigger>
          <TabsTrigger value="results" disabled={!active}>
            Results
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="analyse" className="space-y-6 pt-6">
          {!loading && !signedIn && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
              <p className="text-sm">
                Fill this in now — you&apos;ll be asked to sign in when you run the analysis so we can
                save your report.
              </p>
              <Button size="sm" variant="outline" onClick={() => goToAuth("signin")}>
                Sign in
              </Button>
            </div>
          )}
          <ResumeForm
            prefill={prefill}
            extracting={extraction.isPending}
            onExtract={(file) => extraction.mutateAsync(file)}
            submitting={analysis.isPending}
            onSubmit={handleSubmit}
          />
        </TabsContent>

        <TabsContent value="results" className="pt-6">
          {active ? (
            <ResultsDashboard record={active} onReanalyze={() => reanalyzeFrom(active)} />
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="pt-6">
          {signedIn ? (
            <HistoryList
              records={history.data ?? []}
              loading={history.isLoading}
              onOpen={(record) => {
                setActive(record);
                setTab("results");
              }}
              onReanalyze={reanalyzeFrom}
              onDelete={(record) => removal.mutate(record.id)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <h2 className="text-lg font-semibold">Sign in to see your history</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Past analyses are saved to your account so you can track your score over time.
              </p>
              <Button className="mt-6" onClick={() => goToAuth("signin")}>
                Sign in
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
