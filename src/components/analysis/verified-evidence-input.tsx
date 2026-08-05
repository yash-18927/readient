import { useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyEvidence, type EvidenceVerification } from "@/lib/evidence.functions";

const MONO = { fontFamily: "ui-monospace, SFMono-Regular, monospace" } as const;

export type VerifiableKind = "github" | "leetcode" | "portfolio";

/**
 * Text input for an evidence handle/URL that is checked against the real
 * platform server-side. The verified summary (not the raw handle) is what
 * gets stored as evidence and sent to the analysis prompt.
 */
export function VerifiedEvidenceInput({
  kind,
  label,
  placeholder,
  note,
  value,
  onChange,
  onResolved,
}: {
  kind: VerifiableKind;
  label: string;
  placeholder: string;
  note?: string;
  value: string;
  onChange: (raw: string) => void;
  onResolved: (summary: string) => void;
}) {
  const verifyFn = useServerFn(verifyEvidence);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EvidenceVerification | null>(null);
  const [checked, setChecked] = useState("");

  async function run() {
    const raw = value.trim();
    if (!raw) {
      setResult(null);
      setChecked("");
      onResolved("");
      return;
    }
    if (raw === checked) return;
    setChecking(true);
    try {
      const res = await verifyFn({ data: { kind, value: raw } });
      setResult(res);
      setChecked(raw);
      onResolved(res.summary);
    } catch {
      setResult({
        kind,
        status: "unavailable",
        summary: `${raw} (unverified — check failed)`,
        message: "We couldn't run the check — this will be treated as unverified.",
      });
      setChecked(raw);
      onResolved(`${raw} (unverified — check failed)`);
    } finally {
      setChecking(false);
    }
  }

  const ok = result?.status === "verified";
  const preview = result?.preview;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={`ev-${kind}`}>{label}</Label>
        {note && (
          <span className="text-[0.6rem] tracking-[0.16em] text-muted-foreground" style={MONO}>
            {note.toUpperCase()}
          </span>
        )}
      </div>
      <div className="relative">
        <Input
          id={`ev-${kind}`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setResult(null);
          }}
          onBlur={() => void run()}
        />
        {checking && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!checking && ok && (
          <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-teal-500" />
        )}
        {!checking && result && !ok && (
          <AlertTriangle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-amber-500" />
        )}
      </div>

      {result && (
        <p
          className={
            ok
              ? "text-xs leading-relaxed text-teal-600 dark:text-teal-400"
              : "text-xs leading-relaxed text-amber-600 dark:text-amber-400"
          }
        >
          {result.message}
        </p>
      )}

      {ok && preview && (preview.title || preview.description || preview.image) && (
        <div className="flex gap-3 rounded-lg border border-border p-3">
          {preview.image && (
            <img
              src={preview.image}
              alt=""
              loading="lazy"
              className="size-14 shrink-0 rounded object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{preview.title ?? preview.url}</p>
            {preview.description && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {preview.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
