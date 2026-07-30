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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PILLAR_META, SUB_SCORE_META, type AnalysisResult } from "@/lib/analysis/schema";
import { ScoreBar } from "./primitives";

export function ScoreOverview({ result }: { result: AnalysisResult }) {
  const chartData = [
    { name: "You", score: Math.round(result.overall_score) },
    { name: "Industry baseline", score: Math.round(result.industry_baseline) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="print-block lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Overall readiness</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <span className="font-display text-6xl font-bold tabular-nums">
            {Math.round(result.overall_score)}
          </span>
          <span className="text-sm text-muted-foreground">out of 100</span>
          <Badge className="text-sm">{result.readiness_level}</Badge>
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
        </CardContent>
      </Card>

      <Card className="print-block lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Sub-scores</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SUB_SCORE_META.map((meta) => (
            <ScoreBar key={meta.key} label={meta.label} value={result.sub_scores[meta.key]} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function PillarBreakdown({ result }: { result: AnalysisResult }) {
  const data = PILLAR_META.map((meta) => ({
    pillar: meta.label,
    value: Math.round((result.pillars[meta.key] / meta.max) * 100),
  }));

  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">6-pillar readiness breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-2">
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
      </CardContent>
    </Card>
  );
}
