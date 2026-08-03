import { useMemo, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, UploadCloud, X } from "lucide-react";
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
import { FIELDS, OTHER_ROLE, rolesForField } from "@/lib/analysis/fields";
import { RUBRIC_PILLARS, type JobDraft } from "@/lib/jobs/schema";

export type JobFormValues = {
  title: string;
  company: string;
  requirements: JobDraft["requirements"];
  rubric: JobDraft["rubric"];
  deadline: string | null;
};

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

function Section({
  index,
  title,
  children,
  className,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="border-t border-border pt-8">
      <p className="text-[0.7rem] tracking-[0.28em] text-muted-foreground" style={MONO}>
        {index} — {title.toUpperCase()}
      </p>
      <div className={cn("mt-6", className)}>{children}</div>
    </section>
  );
}

const linesToList = (value: string) =>
  value
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

const commasToList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Two-step creation: raw notes -> AI draft -> reviewable/editable posting. */
type SourceFile = { name: string; text: string };

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ".pdf,.docx,.txt,.md,.eml,.csv,.html";

export function JobCreator({
  extracting,
  onExtract,
  drafting,
  onDraft,
  publishing,
  onPublish,
  onCancel,
}: {
  extracting: boolean;
  onExtract: (file: File) => Promise<string>;
  drafting: boolean;
  onDraft: (input: {
    rawInput: string;
    field?: string;
    targetRole?: string;
    notes?: string;
  }) => Promise<JobDraft>;
  publishing: boolean;
  onPublish: (values: JobFormValues & { rawInput: string }) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [pastedInput, setPastedInput] = useState("");
  const [field, setField] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [deadline, setDeadline] = useState("");

  const roles = useMemo(() => (field ? rolesForField(field) : []), [field]);
  const resolvedRole = role === OTHER_ROLE ? customRole.trim() : role;

  const rawInput = [
    ...files.map((file) => `--- SOURCE: ${file.name} ---\n${file.text}`),
    pastedInput.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  async function handleFiles(list: FileList | File[]) {
    for (const file of Array.from(list)) {
      if (file.size > MAX_BYTES) {
        toast.error("File too large", { description: `${file.name} exceeds 5MB.` });
        continue;
      }
      try {
        const text = await onExtract(file);
        setFiles((prev) => [...prev.filter((f) => f.name !== file.name), { name: file.name, text }]);
        toast.success(`Read ${file.name}`);
      } catch (error) {
        toast.error("Could not read the file", {
          description: error instanceof Error ? error.message : "Try another format.",
        });
      }
    }
  }

  async function generate() {
    const result = await onDraft({
      rawInput,
      field: field || undefined,
      targetRole: resolvedRole || undefined,
      notes: notes.trim() || undefined,
    });
    setDraft({
      ...result,
      requirements: {
        ...result.requirements,
        field: result.requirements.field || field,
      },
    });
  }

  if (!draft) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Upload the source material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              {extracting ? (
                <Loader2 className="size-7 animate-spin text-primary" />
              ) : (
                <UploadCloud className="size-7 text-muted-foreground" />
              )}
              <p className="mt-3 text-sm font-medium">
                {extracting
                  ? "Reading your documents…"
                  : "Drop company emails or requirement sheets here, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, TXT, MD, EML, CSV or HTML · max 5MB each
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {files.length > 0 && (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="size-5 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.text.length.toLocaleString()} characters extracted
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <Label htmlFor="job-paste">Or paste the email / requirement text</Label>
              <Textarea
                id="job-paste"
                rows={6}
                value={pastedInput}
                onChange={(e) => setPastedInput(e.target.value)}
                placeholder="Paste the hiring email, recruitment sheet, or freeform description of the role."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Guide the AI (optional)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Background / field</Label>
              <Select
                value={field}
                onValueChange={(value) => {
                  setField(value);
                  setRole("");
                  setCustomRole("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Which background is this job for?" />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job role</Label>
              <Select value={role} onValueChange={setRole} disabled={!field}>
                <SelectTrigger>
                  <SelectValue placeholder={field ? "Select the position" : "Pick a field first"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {role === OTHER_ROLE && (
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter the job role"
                />
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="job-ai-notes">Notes &amp; additional information for the AI</Label>
              <Textarea
                id="job-ai-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the documents miss: location, work mode, stipend, must-have tools, screening priorities…"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => void generate()}
            disabled={rawInput.trim().length < 30 || drafting || extracting}
          >
            {drafting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {drafting ? "Structuring the role…" : "Generate posting"}
          </Button>
        </div>
      </div>
    );
  }

  const req = draft.requirements;
  const patchReq = (patch: Partial<JobDraft["requirements"]>) =>
    setDraft({ ...draft, requirements: { ...req, ...patch } });

  const weightTotal = Object.values(draft.rubric.pillar_weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Review the posting</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-company">Company</Label>
            <Input
              id="job-company"
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-field">Background / field</Label>
            <Input
              id="job-field"
              value={req.field}
              onChange={(e) => patchReq({ field: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-level">Experience level</Label>
            <Input
              id="job-level"
              value={req.experience_level}
              onChange={(e) => patchReq({ experience_level: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-deadline">Deadline (optional, auto-closes)</Label>
            <Input
              id="job-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="job-summary">Summary</Label>
            <Textarea
              id="job-summary"
              rows={3}
              value={req.summary}
              onChange={(e) => patchReq({ summary: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="job-resp">Responsibilities (one per line)</Label>
            <Textarea
              id="job-resp"
              rows={5}
              value={req.responsibilities.join("\n")}
              onChange={(e) => patchReq({ responsibilities: linesToList(e.target.value) })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="job-extra">Notes &amp; additional information (shown to candidates)</Label>
            <Textarea
              id="job-extra"
              rows={3}
              value={req.additional_info}
              onChange={(e) => patchReq({ additional_info: e.target.value })}
              placeholder="Location, work mode, stipend, joining date, interview process…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-required">Required skills (comma separated)</Label>
            <Textarea
              id="job-required"
              rows={3}
              value={req.required_skills.join(", ")}
              onChange={(e) => patchReq({ required_skills: commasToList(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-nice">Nice-to-have skills (comma separated)</Label>
            <Textarea
              id="job-nice"
              rows={3}
              value={req.nice_to_have_skills.join(", ")}
              onChange={(e) => patchReq({ nice_to_have_skills: commasToList(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Scoring rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Emphasis per pillar, tailored to this role. Total: {weightTotal}%
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {RUBRIC_PILLARS.map((pillar) => (
              <div key={pillar.key} className="space-y-2">
                <Label htmlFor={`w-${pillar.key}`}>{pillar.label}</Label>
                <Input
                  id={`w-${pillar.key}`}
                  type="number"
                  min={0}
                  max={100}
                  value={draft.rubric.pillar_weights[pillar.key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      rubric: {
                        ...draft.rubric,
                        pillar_weights: {
                          ...draft.rubric.pillar_weights,
                          [pillar.key]: Number(e.target.value) || 0,
                        },
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-keywords">ATS keywords (comma separated)</Label>
            <Textarea
              id="job-keywords"
              rows={3}
              value={draft.rubric.ats_keywords.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  rubric: { ...draft.rubric, ats_keywords: commasToList(e.target.value) },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-notes">Evaluator notes</Label>
            <Textarea
              id="job-notes"
              rows={3}
              value={draft.rubric.evaluation_notes}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  rubric: { ...draft.rubric, evaluation_notes: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setDraft(null)}>
          Back to sources
        </Button>
        <Button
          disabled={publishing || draft.title.trim().length < 2}
          onClick={() =>
            onPublish({
              title: draft.title.trim(),
              company: draft.company.trim(),
              requirements: draft.requirements,
              rubric: draft.rubric,
              deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : null,
              rawInput,
            })
          }
        >
          {publishing && <Loader2 className="mr-2 size-4 animate-spin" />}
          Publish job
        </Button>
      </div>
    </div>
  );
}
