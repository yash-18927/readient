import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FileText, Linkedin, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseLinkedInExport, type LinkedInImport } from "@/lib/linkedin.functions";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_LINKEDIN_BYTES = 10 * 1024 * 1024;

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

export function CombinedUpload({
  resumeText,
  resumeFileName,
  extracting,
  onExtract,
  onResumeChange,
  linkedinValue,
  onLinkedInParsed,
  onLinkedInClear,
}: {
  resumeText: string;
  resumeFileName: string;
  extracting: boolean;
  onExtract: (file: File) => Promise<string>;
  onResumeChange: (text: string, fileName: string) => void;
  linkedinValue: string;
  onLinkedInParsed: (data: LinkedInImport) => void;
  onLinkedInClear: () => void;
}) {
  const parseFn = useServerFn(parseLinkedInExport);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [linkedinFileName, setLinkedinFileName] = useState("");
  const [probing, setProbing] = useState(false);
  const [meta, setMeta] = useState<LinkedInImport | null>(null);

  const linkedinUpload = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      return parseFn({ data: { fileName: file.name, base64 } });
    },
    onSuccess: (data, file) => {
      setError("");
      setLinkedinFileName(file.name);
      setMeta(data);
      onLinkedInParsed(data);
      toast.success("LinkedIn data imported", { description: file.name });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Please try again.";
      setError(message);
      setLinkedinFileName("");
      setMeta(null);
      onLinkedInClear();
      toast.error("Could not import that file", { description: message });
    },
  });

  const applyLinkedIn = useCallback(
    (data: LinkedInImport, file: File) => {
      setError("");
      setLinkedinFileName(file.name);
      setMeta(data);
      onLinkedInParsed(data);
      toast.success("LinkedIn data imported", { description: file.name });
    },
    [onLinkedInParsed],
  );

  const uploadResume = useCallback(
    async (file: File) => {
      if (file.size > MAX_RESUME_BYTES) {
        setError("File too large — maximum resume size is 5MB.");
        return;
      }
      setError("");
      try {
        const text = await onExtract(file);
        onResumeChange(text, file.name);
        toast.success("Resume uploaded", { description: file.name });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Please try another file.";
        onResumeChange("", "");
        setError(message);
        toast.error("Could not read resume", { description: message });
      }
    },
    [onExtract, onResumeChange],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase();

      if (lower.endsWith(".pdf")) {
        if (file.size > MAX_LINKEDIN_BYTES) {
          setError("File too large — maximum size is 10MB.");
          return;
        }
        // A PDF is either a LinkedIn profile export or a resume — detect server-side.
        setProbing(true);
        try {
          const base64 = await toBase64(file);
          const data = await parseFn({ data: { fileName: file.name, base64 } });
          applyLinkedIn(data, file);
        } catch (err) {
          const message = err instanceof Error ? err.message : "";
          if (message.includes("LinkedIn profile PDF") || message.includes("could not read that PDF")) {
            await uploadResume(file);
          } else {
            setError(message || "Could not read that PDF.");
            toast.error("Could not read that file", { description: message });
          }
        } finally {
          setProbing(false);
        }
        return;
      }

      if (lower.endsWith(".docx")) {
        await uploadResume(file);
        return;
      }

      if (lower.endsWith(".zip") || lower.endsWith(".csv")) {
        if (file.size > MAX_LINKEDIN_BYTES) {
          setError("File too large — maximum export size is 10MB.");
          return;
        }
        setError("");
        linkedinUpload.mutate(file);
        return;
      }

      setError(
        "Unsupported file — upload a PDF/DOCX resume, your LinkedIn profile PDF, or a LinkedIn export .zip or .csv.",
      );
    },
    [applyLinkedIn, linkedinUpload, parseFn, uploadResume],
  );

  const pending = extracting || probing || linkedinUpload.isPending;

  const hasFiles = Boolean(resumeText || linkedinValue);

  return (
    <div>
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
          const files = Array.from(e.dataTransfer.files ?? []);
          void (async () => {
            for (const file of files) await handleFile(file);
          })();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center transition-colors",
          hasFiles ? "py-8" : "py-14",
          error && "border-destructive/60",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        {pending ? (
          <Loader2 className="size-7 animate-spin text-primary" />
        ) : (
          <UploadCloud className="size-7 text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium">
          {pending ? "Reading your file…" : "Drag & drop, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Resume PDF or DOCX (required) · LinkedIn export .zip or .csv (optional)
        </p>
      </div>

      {(resumeText || linkedinValue) && (
        <div className="mt-3 space-y-2">
          {resumeText && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{resumeFileName || "Resume"}</p>
                  <p className="text-xs text-muted-foreground">
                    {resumeText.length.toLocaleString()} characters extracted
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove resume"
                onClick={() => {
                  onResumeChange("", "");
                  setError("");
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {linkedinValue && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <Linkedin className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {linkedinFileName || "LinkedIn export"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {meta
                      ? `${meta.positions} positions · ${meta.skills} skills · ${meta.education} education entries`
                      : `${linkedinValue.length.toLocaleString()} characters imported`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove LinkedIn export"
                onClick={() => {
                  setLinkedinFileName("");
                  setMeta(null);
                  setError("");
                  onLinkedInClear();
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <p className="mt-2 text-xs text-muted-foreground">
        LinkedIn export ›{" "}
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
        multiple
        accept=".pdf,.docx,.zip,.csv"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          void (async () => {
            for (const file of files) await handleFile(file);
          })();
          e.target.value = "";
        }}
      />
    </div>
  );
}
