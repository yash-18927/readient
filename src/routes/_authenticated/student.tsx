import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResumeForm, type ResumeFormValues } from "@/components/analysis/resume-form";
import { HistoryList } from "@/components/analysis/history-list";
import { ResultsDashboard } from "@/components/analysis/results/results-dashboard";
import {
  analyzeResume,
  deleteAnalysis,
  extractResume,
  listAnalyses,
  type AnalysisRecord,
} from "@/lib/analysis.functions";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: ({ context }) => {
    if (context.profile && context.profile.role !== "student") {
      throw redirect({ to: "/recruiter" });
    }
  },
  head: () => ({
    meta: [
      { title: "Student dashboard — PlacementIQ" },
      { name: "description", content: "Your placement readiness workspace." },
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
  const { profile } = Route.useRouteContext();
  const queryClient = useQueryClient();

  const extractFn = useServerFn(extractResume);
  const analyzeFn = useServerFn(analyzeResume);
  const deleteFn = useServerFn(deleteAnalysis);
  const listFn = useServerFn(listAnalyses);

  const [tab, setTab] = useState("analyse");
  const [active, setActive] = useState<AnalysisRecord | null>(null);
  const [prefill, setPrefill] = useState<ResumeFormValues | null>(null);

  const history = useQuery({ queryKey: ["analyses"], queryFn: () => listFn({}) });

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

  return (
    <DashboardLayout
      profile={profile}
      title={`Hi${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
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

        <TabsContent value="analyse" className="pt-6">
          <ResumeForm
            prefill={prefill}
            extracting={extraction.isPending}
            onExtract={(file) => extraction.mutateAsync(file)}
            submitting={analysis.isPending}
            onSubmit={(values) => analysis.mutate(values)}
          />
        </TabsContent>

        <TabsContent value="results" className="pt-6">
          {active ? (
            <ResultsDashboard record={active} onReanalyze={() => reanalyzeFrom(active)} />
          ) : null}
        </TabsContent>

        <TabsContent value="history" className="pt-6">
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
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
