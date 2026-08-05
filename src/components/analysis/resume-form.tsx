import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { CombinedUpload } from "@/components/analysis/combined-upload";
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
      <Section index="01" title="Your resume & LinkedIn data">
        <CombinedUpload
          resumeText={resumeText}
          resumeFileName={fileName}
          extracting={extracting}
          onExtract={onExtract}
          onResumeChange={(text, name) => {
            setResumeText(text);
            setFileName(name);
          }}
          linkedinValue={evidence["linkedin"] ?? ""}
          onLinkedInParsed={(data) =>
            setEvidence((prev) => ({ ...prev, linkedin: data.summary }))
          }
          onLinkedInClear={() => setEvidence((prev) => ({ ...prev, linkedin: "" }))}
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


      {evidenceKeys.filter((k) => k !== "linkedin").length > 0 && (
        <Section index="03" title="Evidence of competence (optional)">
          <div className="grid gap-4 sm:grid-cols-2">
            {evidenceKeys
              .filter((key) => key !== "linkedin")
              .map((key) => {
                const meta = EVIDENCE_LABELS[key];
                if (key === "github" || key === "leetcode" || key === "portfolio") {
                  return (
                    <div key={key} className="space-y-2">
                      <VerifiedEvidenceInput
                        kind={key}
                        label={meta.label}
                        placeholder={meta.placeholder}
                        note={key === "leetcode" ? "best-effort — may occasionally be unavailable" : undefined}
                        value={raw[key] ?? ""}
                        onChange={(v) => setRaw((prev) => ({ ...prev, [key]: v }))}
                        onResolved={(summary) =>
                          setEvidence((prev) => ({ ...prev, [key]: summary }))
                        }
                      />
                    </div>
                  );
                }
                return (
                  <div key={key} className={cn("space-y-2", meta.multiline && "sm:col-span-2")}>
                    <Label htmlFor={`ev-${key}`}>{meta.label}</Label>
                    {meta.multiline ? (
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
