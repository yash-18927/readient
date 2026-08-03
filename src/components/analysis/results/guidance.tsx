import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { BulletList, MONO, Panel } from "./primitives";

const TAB =
  "rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 text-sm text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function StrengthsWeaknesses({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Panel title="Strengths">
        <BulletList items={result.strengths} />
      </Panel>
      <Panel title="Weaknesses">
        <BulletList items={result.weaknesses} />
      </Panel>
    </div>
  );
}

export function PriorityRecommendations({ result }: { result: AnalysisResult }) {
  return (
    <Panel title="Top 3 priority recommendations" className="grid gap-4 md:grid-cols-3">
        {result.recommendations.map((rec, index) => (
          <div key={rec.skill} className="rounded-lg border border-border p-5">
            <span className="text-[0.7rem] tracking-[0.22em] text-primary" style={MONO}>
              #{String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-medium">{rec.skill}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
            <p className="mt-3 text-sm">
              <span className="font-medium">Start with: </span>
              {rec.resource}
            </p>
          </div>
        ))}
    </Panel>
  );
}

export function Roadmap({ result }: { result: AnalysisResult }) {
  const stages = [
    { key: "weeks_1_2", label: "Weeks 1-2" },
    { key: "month_1", label: "Month 1" },
    { key: "month_2", label: "Month 2" },
    { key: "month_3", label: "Month 3" },
  ] as const;

  return (
    <Panel title="Your 3-month roadmap">
        <Tabs defaultValue="weeks_1_2">
          <TabsList className="h-auto flex-wrap gap-6 rounded-none border-b border-border bg-transparent p-0">
            {stages.map((s) => (
              <TabsTrigger className={TAB} key={s.key} value={s.key}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {stages.map((s) => (
            <TabsContent key={s.key} value={s.key} className="space-y-3 pt-4">
              <p className="text-sm font-medium">{result.roadmap[s.key].focus}</p>
              <BulletList items={result.roadmap[s.key].tasks} />
            </TabsContent>
          ))}
        </Tabs>
    </Panel>
  );
}

export function InterviewQuestions({ result }: { result: AnalysisResult }) {
  const groups = [
    { key: "core", label: "Core" },
    { key: "scenario", label: "Scenario-based" },
    { key: "behavioral", label: "Behavioural" },
    { key: "portfolio", label: "Portfolio-based" },
  ] as const;

  return (
    <Panel title="Interview questions to prepare" className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-2 text-sm font-medium">{group.label}</p>
            <BulletList items={result.interview_questions[group.key]} />
          </div>
        ))}
    </Panel>
  );
}

export function ProjectSuggestions({ result }: { result: AnalysisResult }) {
  return (
    <Panel title="Projects that would close your gaps" className="grid gap-4 md:grid-cols-3">
        {result.project_suggestions.map((project) => (
          <div key={project.name} className="flex flex-col rounded-lg border border-border p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{project.name}</h3>
              <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground" style={MONO}>
                {project.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((skill) => (
                <span key={skill} className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Est. {project.estimated_time}</p>
          </div>
        ))}
    </Panel>
  );
}
