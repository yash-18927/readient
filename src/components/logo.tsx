export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-lg bg-accent-gradient text-[0.7rem] font-bold text-primary-foreground"
      >
        R
      </span>
      <span className="font-display text-base font-bold tracking-tight text-foreground">
        Readient<span className="text-primary"> AI</span>
      </span>
    </span>
  );
}
