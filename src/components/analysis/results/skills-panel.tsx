import { CheckCircle2, XCircle } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/schema";
import { Chip, Panel } from "./primitives";

export function SkillsPanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Panel title="Skill coverage" className="space-y-5">
          <Group title="Matched skills" tone="green" items={result.matched_skills} empty="No matches detected yet." />
          <Group
            title="Missing critical skills"
            tone="red"
            items={result.missing_critical_skills}
            empty="Nothing critical missing."
          />
          <Group
            title="Missing nice-to-have skills"
            tone="yellow"
            items={result.missing_nice_to_have_skills}
            empty="Nothing else recommended."
          />
      </Panel>

      <Panel title="Skill priority matrix" className="grid gap-6 sm:grid-cols-2">
        <Matrix title="Mandatory" rows={result.skill_matrix.mandatory} />
        <Matrix title="Recommended" rows={result.skill_matrix.recommended} />
      </Panel>
    </div>
  );
}

function Group({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "green" | "red" | "yellow";
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.length ? (
          items.map((s) => (
            <Chip key={s} tone={tone}>
              {s}
            </Chip>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </div>
  );
}

function Matrix({ title, rows }: { title: string; rows: { skill: string; has: boolean }[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {rows.length ? (
          rows.map((row) => (
            <li key={row.skill} className="flex items-center gap-2 text-sm">
              {row.has ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" />
              ) : (
                <XCircle className="size-4 shrink-0 text-destructive" />
              )}
              <span className={row.has ? "" : "text-muted-foreground"}>{row.skill}</span>
            </li>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nothing listed.</p>
        )}
      </ul>
    </div>
  );
}
