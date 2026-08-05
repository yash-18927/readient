import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const QUICK_STEPS = [
  "Open your LinkedIn profile.",
  'Click the three-dot "More" menu.',
  'Select "Save to PDF".',
];

const ADVANCED_STEPS = [
  "Go to Settings › Data privacy › Get a copy of your data.",
  "Pick the larger archive (or select Profile, Positions, Skills, Education).",
  "LinkedIn emails you a download link — upload that .zip here.",
];

export function LinkedInHelpDialog({ className }: { className?: string }) {
  const [advanced, setAdvanced] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline",
            className,
          )}
        >
          <HelpCircle className="size-3.5" />
          How do I get this?
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adding your LinkedIn data</DialogTitle>
          <DialogDescription>
            The profile PDF takes about ten seconds and is all we need.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Quick way
          </p>
          <p className="mt-1 text-sm font-medium">Profile PDF</p>
          <ol className="mt-3 space-y-2">
            {QUICK_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs text-primary">0{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Want deeper analysis?
            <ChevronDown
              className={cn("size-4 transition-transform", advanced && "rotate-180")}
            />
          </button>

          {advanced && (
            <div className="mt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Advanced way
              </p>
              <p className="mt-1 text-sm font-medium">Full data export (.zip)</p>
              <ol className="mt-3 space-y-2">
                {ADVANCED_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="font-mono text-xs">0{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://www.linkedin.com/help/linkedin/answer/a1339364"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block text-xs text-primary underline underline-offset-4"
              >
                LinkedIn's export help page
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
