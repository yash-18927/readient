import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseLinkedInExport, type LinkedInImport } from "@/lib/linkedin.functions";

const MAX_BYTES = 10 * 1024 * 1024;

const FILE_LABELS: Record<string, string> = {
  "profile.csv": "Profile",
  "positions.csv": "Positions",
  "skills.csv": "Skills",
  "education.csv": "Education",
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

export function LinkedInUpload({
  value,
  onParsed,
  onClear,
}: {
  value?: string;
  onParsed: (data: LinkedInImport) => void;
  onClear: () => void;
}) {
  const parseFn = useServerFn(parseLinkedInExport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [meta, setMeta] = useState<LinkedInImport | null>(null);
  const [error, setError] = useState("");

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      return parseFn({ data: { fileName: file.name, base64 } });
    },
    onSuccess: (data, file) => {
      setError("");
      setFileName(file.name);
      setMeta(data);
      onParsed(data);
      toast.success("LinkedIn data imported", {
        description: data.filesMissing.length
          ? `Read: ${data.filesFound.map((f) => FILE_LABELS[f] ?? f).join(", ")}.`
          : "Profile, positions, skills and education were read.",
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      setError(message);
      setFileName("");
      setMeta(null);
      onClear();
      toast.error("Could not import that file", { description: message });
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".zip") && !lower.endsWith(".csv")) {
        setError(
          "Unsupported file — upload your LinkedIn data export .zip, or a single Profile/Positions/Skills/Education CSV.",
        );
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File too large — maximum export size is 10MB.");
        return;
      }
      setError("");
      upload.mutate(file);
    },
    [upload],
  );

  return (
    <div>
      {value ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{fileName || "LinkedIn export"}</p>
              <p className="text-xs text-muted-foreground">
                {meta
                  ? `${meta.positions} positions · ${meta.skills} skills · ${meta.education} education entries`
                  : `${value.length.toLocaleString()} characters imported`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove LinkedIn export"
            onClick={() => {
              setFileName("");
              setMeta(null);
              setError("");
              onClear();
            }}
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
            if (file) handleFile(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
            error && "border-destructive/60",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          {upload.isPending ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground" />
          )}
          <p className="mt-3 text-sm font-medium">
            {upload.isPending ? "Reading your export…" : "Drag & drop, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            LinkedIn export .zip, or a single Profile/Positions/Skills/Education .csv
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <p className="mt-2 text-xs text-muted-foreground">
        Get it from LinkedIn ›{" "}
        <a
          href="https://www.linkedin.com/help/linkedin/answer/a1339364"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary underline underline-offset-4"
        >
          Settings › Data privacy › Get a copy of your data
        </a>
        . Only Profile, Positions, Skills and Education are read; other files are ignored.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.csv,application/zip,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

