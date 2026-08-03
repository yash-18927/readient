import type { AnalysisResult } from "@/lib/analysis/schema";
import { AtsAudit } from "@/components/analysis/results/ats-audit";
import { PillarBreakdown, ScoreOverview } from "@/components/analysis/results/score-overview";
import { SkillsPanel } from "@/components/analysis/results/skills-panel";
import {
  InterviewQuestions,
  PriorityRecommendations,
  ProjectSuggestions,
  Roadmap,
  StrengthsWeaknesses,
} from "@/components/analysis/results/guidance";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

/** Full analysis depth for one candidate, scoped to a single job posting. */
export function CandidateReport({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <ScoreOverview result={result} />

      <section className="print-block border-t border-border pt-8">
        <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
          FIT SUMMARY
        </p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed">
          <p>{result.executive_summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="mb-1 font-medium">Credential audit</p>
              <p className="text-muted-foreground">{result.credential_audit}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="mb-1 font-medium">Role fit</p>
              <p className="text-muted-foreground">{result.role_fit_summary}</p>
            </div>
          </div>
        </div>
      </section>

      <SkillsPanel result={result} />
      <AtsAudit result={result} />
      <PillarBreakdown result={result} />
      <StrengthsWeaknesses result={result} />
      <PriorityRecommendations result={result} />
      <Roadmap result={result} />
      <InterviewQuestions result={result} />
      <ProjectSuggestions result={result} />
    </div>
  );
}
