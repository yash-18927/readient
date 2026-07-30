import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
        <h2 className="text-lg font-semibold">No analyses yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Run your first resume analysis and it will appear here so you can track your score over time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{record.target_role}</p>
                <Badge variant="secondary">{record.field}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(record.created_at).toLocaleString()}
                {record.resume_file_name ? ` · ${record.resume_file_name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">{record.overall_score}</p>
                <p className="text-xs text-muted-foreground">{record.result.readiness_level}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpen(record)}>
                View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onReanalyze(record)}>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
