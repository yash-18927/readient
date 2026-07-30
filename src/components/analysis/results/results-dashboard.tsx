import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisRecord } from "@/lib/analysis.functions";
import { AtsAudit } from "./ats-audit";
import { PillarBreakdown, ScoreOverview } from "./score-overview";
import { SkillsPanel } from "./skills-panel";
import {
  InterviewQuestions,
  PriorityRecommendations,
  ProjectSuggestions,
  Roadmap,
  StrengthsWeaknesses,
} from "./guidance";

export function ResultsDashboard({
  record,
  onReanalyze,
}: {
  record: AnalysisRecord;
  onReanalyze: () => void;
}) {
  const result = record.result;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-semibold">{record.target_role}</h2>
          <p className="text-sm text-muted-foreground">
            {record.field} · analysed {new Date(record.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReanalyze}>
            <RotateCcw className="mr-2 size-4" /> Re-analyse
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="mr-2 size-4" /> Download report
          </Button>
        </div>
      </div>

      <ScoreOverview result={result} />

      <Card className="print-block">
        <CardHeader>
          <CardTitle className="text-base">Executive summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>{result.executive_summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="mb-1 font-medium">Credential audit</p>
              <p className="text-muted-foreground">{result.credential_audit}</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="mb-1 font-medium">Role fit</p>
              <p className="text-muted-foreground">{result.role_fit_summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SkillsPanel result={result} />
      <AtsAudit result={result} />
      <PillarBreakdown result={result} />
      <StrengthsWeaknesses result={result} />
      <PriorityRecommendations result={result} />
      <Roadmap result={result} />
      <InterviewQuestions result={result} />
      <ProjectSuggestions result={result} />

      <Card className="print-block border-primary/30 bg-primary/5">
        <CardContent className="py-6 text-sm leading-relaxed">{result.encouragement}</CardContent>
      </Card>
    </div>
  );
}
