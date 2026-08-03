import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisRecord } from "@/lib/analysis.functions";

export function HistoryList({
  records,
  loading,
  onOpen,
  onReanalyze,
  onDelete,
}: {
  records: AnalysisRecord[];
  loading: boolean;
  onOpen: (record: AnalysisRecord) => void;
  onReanalyze: (record: AnalysisRecord) => void;
  onDelete: (record: AnalysisRecord) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-transparent p-12">
        <h2 className="text-base font-medium tracking-tight text-foreground">No analyses yet</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Run your first resume analysis and it will appear here so you can track your score over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border px-5 py-4 transition-colors hover:border-primary/40"
        >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium tracking-tight">{record.target_role}</p>
                <span
                  className="text-[0.65rem] tracking-[0.2em] text-muted-foreground"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
                >
                  {record.field.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(record.created_at).toLocaleString()}
                {record.resume_file_name ? ` · ${record.resume_file_name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-medium tabular-nums tracking-tight">{record.overall_score}</p>
                <p className="text-xs text-muted-foreground">{record.result.readiness_level}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => onOpen(record)}>
                View
              </Button>
              <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onReanalyze(record)}>
                Re-analyse
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete analysis"
                onClick={() => onDelete(record)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
        </div>
      ))}
    </div>
  );
}
