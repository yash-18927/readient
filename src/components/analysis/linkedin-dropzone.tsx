import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Linkedin, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { summariseLinkedInExport } from "@/lib/analysis/linkedin-csv";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Drop box for LinkedIn's data-export CSV files. Parsing happens entirely in
 * the browser; only the flattened text summary is sent with the analysis.
 */
export function LinkedInDropzone({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (summary: string) => void;
  className?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [label, setLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      const files = Array.from(fileList ?? []).filter((file) => file.name.toLowerCase().endsWith(".csv"));

      if (files.length === 0) {
        toast.error("Upload LinkedIn CSV files", {
          description: "Unzip the export from LinkedIn and drop the .csv files here.",
        });
        return;
      }
      if (files.some((file) => file.size > MAX_BYTES)) {
        toast.error("File too large", { description: "Each CSV must be under 5MB." });
        return;
      }

      const parsed = summariseLinkedInExport(
        await Promise.all(files.map(async (file) => ({ name: file.name, text: await file.text() }))),
      );

      if (!parsed.summary) {
        toast.error("Nothing readable in those files", {
          description: "Try Profile.csv, Positions.csv, Skills.csv or Education.csv from your export.",
        });
        return;
      }

      onChange(parsed.summary);
      setLabel(`${files.length} file${files.length > 1 ? "s" : ""} · ${parsed.sections.join(", ")}`);
      toast.success("LinkedIn export added");
    },
    [onChange],
  );

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-border bg-transparent px-4 py-3",
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Linkedin className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">LinkedIn export</p>
            <p className="truncate text-xs text-muted-foreground">
              {label || `${value.length.toLocaleString()} characters parsed`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove LinkedIn export"
          onClick={() => {
            onChange("");
            setLabel("");
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          className,
        )}
      >
        <FileSpreadsheet className="size-7 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Drop your LinkedIn export CSVs, or click to browse</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Settings → Data privacy → Get a copy of your data · unzip, then drop the .csv files
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}
