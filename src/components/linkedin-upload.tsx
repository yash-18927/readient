import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileArchive, Loader2, UploadCloud, X } from "lucide-react";
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

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await toBase64(file);
      return parseFn({ data: { fileName: file.name, base64 } });
    },
    onSuccess: (data, file) => {
      setFileName(file.name);
      setMeta(data);
      onParsed(data);
      toast.success("LinkedIn export imported", {
        description: data.filesMissing.length
          ? `Missing from your export: ${data.filesMissing
              .map((f) => FILE_LABELS[f] ?? f)
              .join(", ")} — we used everything else.`
          : "Profile, positions, skills and education were read.",
      });
    },
    onError: (error) =>
      toast.error("Could not import that file", {
        description: error instanceof Error ? error.message : "Please try again.",
      }),
  });

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("Unsupported file type", {
          description:
            "This doesn't look like a LinkedIn data export — please upload the zip file from LinkedIn's 'Get a copy of your data' feature.",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("File too large", { description: "Maximum export size is 10MB." });
        return;
      }
      upload.mutate(file);
    },
    [upload],
  );

  if (value) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-transparent px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileArchive className="size-5 shrink-0 text-primary" />
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
            onClear();
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

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
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
      >
        {upload.isPending ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <UploadCloud className="size-6 text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium">
          {upload.isPending ? "Reading your export…" : "Drop your LinkedIn data export (.zip)"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload the .zip file from LinkedIn's "Get a copy of your data" export.
        </p>
      </div>
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
        accept=".zip,application/zip"
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
