import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PILLAR_META, SUB_SCORE_META, type AnalysisResult } from "@/lib/analysis/schema";
import { MONO, Panel, ScoreBar } from "./primitives";

export function ScoreOverview({ result }: { result: AnalysisResult }) {
  const chartData = [
    { name: "You", score: Math.round(result.overall_score) },
    { name: "Industry baseline", score: Math.round(result.industry_baseline) },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Panel title="Overall readiness" wrapperClassName="lg:col-span-1">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="font-display text-6xl font-light tabular-nums">
            {Math.round(result.overall_score)}
          </span>
          <span className="text-sm text-muted-foreground">out of 100</span>
          <span className="text-[0.65rem] tracking-[0.22em] text-primary" style={MONO}>
            {result.readiness_level.toUpperCase()}
          </span>
          <div className="mt-4 h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 100]} width={28} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={false} />
                <Bar dataKey="score" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>

      <Panel title="Sub-scores" wrapperClassName="lg:col-span-2" className="grid gap-4 sm:grid-cols-2">
        {SUB_SCORE_META.map((meta) => (
          <ScoreBar key={meta.key} label={meta.label} value={result.sub_scores[meta.key]} />
        ))}
      </Panel>
    </div>
  );
}

export function PillarBreakdown({ result }: { result: AnalysisResult }) {
  const data = PILLAR_META.map((meta) => ({
    pillar: meta.label,
    value: Math.round((result.pillars[meta.key] / meta.max) * 100),
  }));

  return (
    <Panel title="6-pillar readiness breakdown" className="grid gap-8 lg:grid-cols-2">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="pillar" fontSize={11} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4 self-center">
          {PILLAR_META.map((meta) => (
            <ScoreBar
              key={meta.key}
              label={meta.label}
              value={result.pillars[meta.key]}
              max={meta.max}
            />
          ))}
        </div>
    </Panel>
  );
}
