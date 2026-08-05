import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { LinkedInUpload } from "@/components/linkedin-upload";
import {
  EVIDENCE_LABELS,
  FIELDS,
  OTHER_ROLE,
  evidenceForField,
  rolesForField,
  type EvidenceKey,
} from "@/lib/analysis/fields";

export type ResumeFormValues = {
  field: string;
  targetRole: string;
  jobDescription: string;
  evidence: Record<string, string>;
  resumeText: string;
  resumeFileName?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
        {index} — {title.toUpperCase()}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}



export function ResumeForm({
  prefill,
  extracting,
  onExtract,
  submitting,
  onSubmit,
}: {
  prefill?: ResumeFormValues | null;
  extracting: boolean;
  onExtract: (file: File) => Promise<string>;
  submitting: boolean;
  onSubmit: (values: ResumeFormValues) => void;
}) {
  const [field, setField] = useState(prefill?.field ?? "");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [jobDescription, setJobDescription] = useState(prefill?.jobDescription ?? "");
  const [evidence, setEvidence] = useState<Record<string, string>>(prefill?.evidence ?? {});
  const [resumeText, setResumeText] = useState(prefill?.resumeText ?? "");
  const [fileName, setFileName] = useState(prefill?.resumeFileName ?? "");
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    if (!prefill) return;
    setField(prefill.field);
    const known = rolesForField(prefill.field).includes(prefill.targetRole);
    setRole(known ? prefill.targetRole : OTHER_ROLE);
    setCustomRole(known ? "" : prefill.targetRole);
    setJobDescription(prefill.jobDescription ?? "");
    setEvidence(prefill.evidence ?? {});
    setResumeText(prefill.resumeText);
    setFileName(prefill.resumeFileName ?? "");
  }, [prefill]);

  const roles = useMemo(() => (field ? rolesForField(field) : []), [field]);
  const evidenceKeys: EvidenceKey[] = useMemo(() => (field ? evidenceForField(field) : []), [field]);

  const handleFile = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
        setResumeError("Unsupported file type — upload a PDF or DOCX resume.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setResumeError("File too large — maximum resume size is 5MB.");
        return;
      }
      setResumeError("");
      try {
        const text = await onExtract(file);
        setResumeText(text);
        setFileName(file.name);
        toast.success("Resume uploaded", { description: file.name });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Please try another file.";
        setResumeText("");
        setFileName("");
        setResumeError(message);
        toast.error("Could not read resume", { description: message });
      }
    },
    [onExtract],
  );

  const resolvedRole = role === OTHER_ROLE ? customRole.trim() : role;
  const canSubmit = Boolean(resumeText && field && resolvedRole) && !submitting && !extracting;

  return (
    <form
      className="space-y-10"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          field,
          targetRole: resolvedRole,
          jobDescription: jobDescription.trim(),
          evidence: Object.fromEntries(
            Object.entries(evidence).filter(([, value]) => value && value.trim()),
          ),
          resumeText,
          resumeFileName: fileName || undefined,
        });
      }}
    >
      <Section index="01" title="Your resume">
        <UploadDropzone
          size="lg"
          accept=".pdf,.docx"
          filled={Boolean(resumeText)}
          fileName={fileName || "Resume text"}
          fileMeta={`${resumeText.length.toLocaleString()} characters extracted`}
          clearLabel="Remove resume"
          pending={extracting}
          pendingLabel="Reading your resume…"
          idleLabel="Drag & drop your resume, or click to browse"
          hint="PDF or DOCX · max 5MB"
          error={resumeError}
          onFile={(file) => void handleFile(file)}
          onClear={() => {
            setResumeText("");
            setFileName("");
            setResumeError("");
          }}
        />
      </Section>


      <Section index="02" title="Target role">
        <div className="grid gap-4 sm:grid-cols-2">

          <div className="space-y-2">
            <Label>Field of study</Label>
            <Select
              value={field}
              onValueChange={(value) => {
                setField(value);
                setRole("");
                setCustomRole("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target role</Label>
            <Select value={role} onValueChange={setRole} disabled={!field}>
              <SelectTrigger>
                <SelectValue placeholder={field ? "Select a role" : "Pick a field first"} />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === OTHER_ROLE && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="custom-role">Custom role</Label>
              <Input
                id="custom-role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Solar Energy Analyst"
              />
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="jd">Job description (optional)</Label>
            <Textarea
              id="jd"
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job posting to compare your resume against that specific role."
            />
          </div>
        </div>
      </Section>


      {evidenceKeys.length > 0 && (
        <Section index="03" title="Evidence of competence (optional)">
          <div className="grid gap-4 sm:grid-cols-2">
            {evidenceKeys.map((key) => {
              const meta = EVIDENCE_LABELS[key];
              return (
                <div key={key} className={cn("space-y-2", meta.multiline && "sm:col-span-2")}>
                  <Label htmlFor={`ev-${key}`}>{meta.label}</Label>
                  {key === "linkedin" ? (
                    <LinkedInUpload
                      value={evidence[key] ?? ""}
                      onParsed={(data) =>
                        setEvidence((prev) => ({ ...prev, linkedin: data.summary }))
                      }
                      onClear={() => setEvidence((prev) => ({ ...prev, linkedin: "" }))}
                    />
                  ) : meta.multiline ? (
                    <Textarea
                      id={`ev-${key}`}
                      rows={3}
                      value={evidence[key] ?? ""}
                      placeholder={meta.placeholder}
                      onChange={(e) => setEvidence((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={`ev-${key}`}
                      value={evidence[key] ?? ""}
                      placeholder={meta.placeholder}
                      onChange={(e) => setEvidence((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Section>

      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="rounded-lg" disabled={!canSubmit}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitting ? "Analysing your readiness…" : "Analyse my readiness"}
        </Button>
      </div>
    </form>
  );
}
