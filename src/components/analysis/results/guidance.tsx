import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { BulletList } from "./primitives";

export function StrengthsWeaknesses({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="print-block">
        <CardHeader>
          <CardTitle className="text-base text-success">Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <BulletList items={result.strengths} />
        </CardContent>
      </Card>
      <Card className="print-block">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Weaknesses</CardTitle>
        </CardHeader>
        <CardContent>
          <BulletList items={result.weaknesses} />
        </CardContent>
      </Card>
    </div>
  );
}

export function PriorityRecommendations({ result }: { result: AnalysisResult }) {
  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">Top 3 priority recommendations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {result.recommendations.map((rec, index) => (
          <div key={rec.skill} className="rounded-xl border border-border bg-muted/30 p-5">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="mt-3 font-semibold">{rec.skill}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
            <p className="mt-3 text-sm">
              <span className="font-medium">Start with: </span>
              {rec.resource}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
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
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">Your 3-month roadmap</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weeks_1_2">
          <TabsList className="flex-wrap">
            {stages.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
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
      </CardContent>
    </Card>
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
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">Interview questions to prepare</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-2 text-sm font-medium">{group.label}</p>
            <BulletList items={result.interview_questions[group.key]} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProjectSuggestions({ result }: { result: AnalysisResult }) {
  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">Projects that would close your gaps</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {result.project_suggestions.map((project) => (
          <div key={project.name} className="flex flex-col rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{project.name}</h3>
              <Badge variant="secondary">{project.difficulty}</Badge>
            </div>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.skills.map((skill) => (
                <span key={skill} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Est. {project.estimated_time}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
