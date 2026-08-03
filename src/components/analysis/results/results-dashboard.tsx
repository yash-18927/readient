import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisRecord } from "@/lib/analysis.functions";
import { MONO, Panel } from "./primitives";
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
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="font-display text-2xl font-light tracking-tight">{record.target_role}</h2>
          <p className="mt-1 text-[0.7rem] tracking-[0.18em] text-muted-foreground" style={MONO}>
            {record.field.toUpperCase()} · ANALYSED {new Date(record.created_at).toLocaleString()}
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

      <Panel title="Executive summary" className="space-y-6 text-sm leading-relaxed">
        <p className="max-w-3xl">{result.executive_summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-5">
            <p className="mb-2 text-[0.65rem] tracking-[0.22em] text-muted-foreground" style={MONO}>
              CREDENTIAL AUDIT
            </p>
            <p className="text-muted-foreground">{result.credential_audit}</p>
          </div>
          <div className="rounded-lg border border-border p-5">
            <p className="mb-2 text-[0.65rem] tracking-[0.22em] text-muted-foreground" style={MONO}>
              ROLE FIT
            </p>
            <p className="text-muted-foreground">{result.role_fit_summary}</p>
          </div>
        </div>
      </Panel>

      <SkillsPanel result={result} />
      <AtsAudit result={result} />
      <PillarBreakdown result={result} />
      <StrengthsWeaknesses result={result} />
      <PriorityRecommendations result={result} />
      <Roadmap result={result} />
      <InterviewQuestions result={result} />
      <ProjectSuggestions result={result} />

      <div className="print-block border-l-2 border-primary py-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        {result.encouragement}
      </div>
    </div>
  );
}
