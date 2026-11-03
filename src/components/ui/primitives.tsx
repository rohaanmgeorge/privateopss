import type { ComponentProps, ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-5 place-items-center rounded border border-current/25 px-1 font-mono text-[10px] leading-4 opacity-70">
      {children}
    </kbd>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.18em] text-muted ${className}`}>{children}</p>
  );
}

export function Panel({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-[28px] border border-line bg-card ${className}`} {...props} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" | "signal" | "danger" };

export function Button({ variant = "ghost", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-ink text-paper hover:opacity-90",
    signal: "bg-signal text-signal-ink hover:brightness-110",
    ghost: "border border-line text-ink hover:border-line-strong hover:bg-paper-2",
    danger: "border border-negative/30 text-negative hover:bg-negative/10",
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  );
}

/** Thin progress rail; turns signal-coloured as it approaches/exceeds 100%. */
export function Meter({ ratio, color }: { ratio: number; color?: string }) {
  const pct = Math.min(1, ratio) * 100;
  const over = ratio > 1;
  const warn = ratio > 0.85;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line" role="presentation">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out-expo"
        style={{ width: `${pct}%`, background: over || warn ? "var(--signal)" : (color ?? "var(--ink)") }}
      />
    </div>
  );
}
