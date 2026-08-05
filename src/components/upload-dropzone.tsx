import { useRef, useState } from "react";
import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadDropzoneProps = {
  /** Native accept attribute, e.g. ".pdf,.docx" */
  accept: string;
  /** Idle headline, e.g. "Drag & drop your resume, or click to browse" */
  idleLabel: string;
  /** Small hint under the headline, e.g. "PDF or DOCX · max 5MB" */
  hint: string;
  /** Shown while pending, e.g. "Reading your resume…" */
  pendingLabel: string;
  /** Filled state */
  filled?: boolean;
  fileName?: string;
  fileMeta?: string;
  clearLabel: string;
  pending?: boolean;
  error?: string;
  /** Visual scale — "lg" for the primary resume slot, "sm" for inline slots */
  size?: "sm" | "lg";
  onFile: (file: File) => void;
  onClear: () => void;
};

export function UploadDropzone({
  accept,
  idleLabel,
  hint,
  pendingLabel,
  filled,
  fileName,
  fileMeta,
  clearLabel,
  pending,
  error,
  size = "lg",
  onFile,
  onClear,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pad = size === "lg" ? "px-6 py-14" : "px-6 py-8";
  const filledPad = size === "lg" ? "px-6 py-8" : "px-4 py-5";
  const icon = size === "lg" ? "size-7" : "size-6";

  return (
    <div>
      {filled ? (
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-lg border border-dashed border-primary/50 bg-primary/5",
            filledPad,
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 className={cn("shrink-0 text-primary", icon)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName}</p>
              {fileMeta && <p className="text-xs text-muted-foreground">{fileMeta}</p>}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={clearLabel}
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
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
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-center transition-colors",
            pad,
            error && "border-destructive/60",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          {pending ? (
            <Loader2 className={cn("animate-spin text-primary", icon)} />
          ) : (
            <UploadCloud className={cn("text-muted-foreground", icon)} />
          )}
          <p className="mt-3 text-sm font-medium">{pending ? pendingLabel : idleLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
