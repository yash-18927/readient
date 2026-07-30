import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RUBRIC_PILLARS, type JobDraft } from "@/lib/jobs/schema";

export type JobFormValues = {
  title: string;
  company: string;
  requirements: JobDraft["requirements"];
  rubric: JobDraft["rubric"];
  deadline: string | null;
};

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
export function JobCreator({
  drafting,
  onDraft,
  publishing,
  onPublish,
  onCancel,
}: {
  drafting: boolean;
  onDraft: (rawInput: string) => Promise<JobDraft>;
  publishing: boolean;
  onPublish: (values: JobFormValues & { rawInput: string }) => void;
  onCancel: () => void;
}) {
  const [rawInput, setRawInput] = useState("");
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [deadline, setDeadline] = useState("");

  async function generate() {
    const result = await onDraft(rawInput);
    setDraft(result);
  }

  if (!draft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe the role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={12}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste your recruitment sheet, hiring notes, or a freeform description of the role. The AI turns it into a structured posting with a scoring rubric."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => void generate()} disabled={rawInput.trim().length < 30 || drafting}>
              {drafting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {drafting ? "Structuring the role…" : "Generate posting"}
            </Button>
          </div>
        </CardContent>
      </Card>
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
          <CardTitle className="text-base">1. Review the posting</CardTitle>
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
          <CardTitle className="text-base">2. Scoring rubric</CardTitle>
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
          Back to notes
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
