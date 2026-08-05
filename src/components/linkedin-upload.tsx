import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UploadDropzone } from "@/components/upload-dropzone";
import { LinkedInHelpDialog } from "@/components/linkedin-help-dialog";
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
      if (!lower.endsWith(".pdf") && !lower.endsWith(".zip") && !lower.endsWith(".csv")) {
        setError(
          "Unsupported file — upload your LinkedIn profile PDF, your data export .zip, or a single Profile/Positions/Skills/Education CSV.",
        );
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File too large — maximum size is 10MB.");
        return;
      }
      setError("");
      upload.mutate(file);
    },
    [upload],
  );

  return (
    <div>
      <UploadDropzone
        size="sm"
        accept=".pdf,.zip,.csv,application/pdf,application/zip,text/csv"
        filled={Boolean(value)}
        fileName={fileName || "LinkedIn export"}
        fileMeta={
          meta
            ? `${meta.positions} positions · ${meta.skills} skills · ${meta.education} education entries`
            : `${value?.length.toLocaleString() ?? 0} characters imported`
        }
        clearLabel="Remove LinkedIn data"
        pending={upload.isPending}
        pendingLabel="Reading your LinkedIn data…"
        idleLabel="Drag & drop, or click to browse"
        hint="LinkedIn profile PDF (quickest), or a data export .zip / .csv"
        error={error}
        onFile={handleFile}
        onClear={() => {
          setFileName("");
          setMeta(null);
          setError("");
          onClear();
        }}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Upload your LinkedIn profile PDF (or your data export .zip for advanced analysis).
        </p>
        <LinkedInHelpDialog className="shrink-0" />
      </div>
    </div>
  );
}


